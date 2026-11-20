"""
Tests for CORS configuration and middleware behaviour.

Settings-level tests verify the assemble_cors_origins validator logic, hostname parsing,
wildcard rejection, and localhost default fallback behavior.
Middleware integration tests verify CORSMiddleware enforcement at the HTTP layer,
including preflight OPTIONS negotiation for localhost origins, untrusted origin rejection,
method and header restrictions, and production frontend origin verification via the
application middleware stack.
"""
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.config import Settings

PRODUCTION_ORIGIN = "https://pennywise-tawny-two.vercel.app"
LOCALHOST_ORIGIN = "http://localhost:5173"
EVIL_ORIGIN = "https://evil-attacker.com"

ALL_LOCALHOST_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# ---------------------------------------------------------------------------
# Settings-level tests
# ---------------------------------------------------------------------------


def test_production_origin_preserved_exactly():
    """A single production URL is kept verbatim in CORS_ORIGINS."""
    s = Settings(CORS_ORIGINS=PRODUCTION_ORIGIN)
    assert PRODUCTION_ORIGIN in s.CORS_ORIGINS


def test_production_config_does_not_append_localhost():
    """When an external origin is explicitly configured, localhost origins are
    NOT injected — preventing accidental localhost access in production."""
    s = Settings(CORS_ORIGINS=PRODUCTION_ORIGIN)
    for local in ALL_LOCALHOST_ORIGINS:
        assert local not in s.CORS_ORIGINS, (
            f"localhost origin {local!r} must not appear in production CORS config"
        )


def test_production_config_contains_exactly_one_origin():
    """Supplying a single external origin must yield a list of exactly one entry."""
    s = Settings(CORS_ORIGINS=PRODUCTION_ORIGIN)
    assert len(s.CORS_ORIGINS) == 1


def test_localhost_defaults_when_no_origins_configured():
    """When CORS_ORIGINS is None (not set), all four localhost defaults are returned."""
    s = Settings(CORS_ORIGINS=None)
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_wildcard_origin_rejected():
    """Wildcard '*' origin must be rejected with a Pydantic ValidationError."""
    with pytest.raises(ValidationError):
        Settings(CORS_ORIGINS="*")


def test_wildcard_origin_in_list_rejected():
    """Wildcard '*' supplied inside a list must also be rejected with ValidationError."""
    with pytest.raises(ValidationError):
        Settings(CORS_ORIGINS=["https://example.com", "*"])


def test_attacker_subdomain_origin_treated_as_external():
    """http://localhost.attacker.com has an external hostname despite starting with 'localhost'.
    It must be treated as external and NOT supplemented with localhost defaults."""
    s = Settings(CORS_ORIGINS="http://localhost.attacker.com")
    assert s.CORS_ORIGINS == ["http://localhost.attacker.com"]
    for local in ALL_LOCALHOST_ORIGINS:
        assert local not in s.CORS_ORIGINS, (
            f"localhost origin {local!r} must not appear when external origin is configured"
        )


def test_attacker_ip_suffix_origin_treated_as_external():
    """http://127.0.0.1.attacker.com has an external hostname despite starting with '127.0.0.1'.
    It must be treated as external and NOT supplemented with localhost defaults."""
    s = Settings(CORS_ORIGINS="http://127.0.0.1.attacker.com")
    assert s.CORS_ORIGINS == ["http://127.0.0.1.attacker.com"]
    for local in ALL_LOCALHOST_ORIGINS:
        assert local not in s.CORS_ORIGINS


def test_explicit_external_origins_not_supplemented_with_localhost():
    """Explicitly configured external origins must not be supplemented with localhost defaults."""
    s = Settings(CORS_ORIGINS="https://pennywise.example.com, https://api.example.com")
    assert s.CORS_ORIGINS == ["https://pennywise.example.com", "https://api.example.com"]
    for local in ALL_LOCALHOST_ORIGINS:
        assert local not in s.CORS_ORIGINS


def test_genuine_localhost_origins_receive_development_defaults():
    """When only genuine localhost origins (e.g. http://localhost:5173 or http://127.0.0.1:5173)
    are provided, the full set of development localhost origins is returned."""
    s1 = Settings(CORS_ORIGINS="http://localhost:5173")
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s1.CORS_ORIGINS

    s2 = Settings(CORS_ORIGINS=["http://127.0.0.1:3000"])
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s2.CORS_ORIGINS


# ---------------------------------------------------------------------------
# Middleware integration tests  (use the `client` fixture from conftest.py)
# ---------------------------------------------------------------------------


def test_allowed_localhost_origin_preflight(client: TestClient):
    """Preflight from a permitted localhost origin must receive a 200 with the
    correct Access-Control-Allow-Origin header."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": LOCALHOST_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("access-control-allow-origin") == LOCALHOST_ORIGIN


def test_untrusted_origin_rejected_on_preflight(client: TestClient):
    """Preflight from an untrusted origin must not receive an allow-origin header."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": EVIL_ORIGIN,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_unapproved_method_rejected_on_preflight(client: TestClient):
    """Preflight requesting a method not in [GET, POST] must be rejected.

    Starlette CORSMiddleware echoes the Origin even on a rejected preflight,
    but it returns 400 Bad Request and does NOT include the requested method in
    Access-Control-Allow-Methods, so the browser will block the actual request.
    """
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": LOCALHOST_ORIGIN,
            "Access-Control-Request-Method": "DELETE",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    allowed_methods = response.headers.get("access-control-allow-methods", "")
    assert "DELETE" not in allowed_methods


def test_unapproved_header_rejected_on_preflight(client: TestClient):
    """Preflight requesting a custom header not in [Content-Type, Accept] must be rejected.

    Starlette CORSMiddleware echoes the Origin even on a rejected preflight,
    but it returns 400 Bad Request and does NOT include the custom header in
    Access-Control-Allow-Headers, so the browser will block the actual request.
    """
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": LOCALHOST_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "X-Custom-Evil-Header",
        },
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    allowed_headers = response.headers.get("access-control-allow-headers", "")
    assert "X-Custom-Evil-Header" not in allowed_headers


def test_simple_request_from_untrusted_origin_no_allow_origin(client: TestClient):
    """A simple GET from an untrusted origin must succeed (200) but must NOT carry
    an Access-Control-Allow-Origin response header."""
    response = client.get(
        "/api/v1/health",
        headers={"Origin": EVIL_ORIGIN},
    )
    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("access-control-allow-origin") is None


def test_production_origin_preflight_accepted(client: TestClient, monkeypatch: pytest.MonkeyPatch):
    """Explicitly verify that a preflight request from the production frontend origin
    (https://pennywise-tawny-two.vercel.app) is accepted for an allowed POST request
    with the Content-Type header on the application."""
    if app.middleware_stack is None:
        app.middleware_stack = app.build_middleware_stack()

    cors_middleware = None
    curr = app.middleware_stack
    while curr:
        if hasattr(curr, "allow_origins"):
            cors_middleware = curr
            break
        curr = getattr(curr, "app", None)

    assert cors_middleware is not None, "CORSMiddleware not found in app.middleware_stack"

    monkeypatch.setattr(cors_middleware, "allow_origins", [PRODUCTION_ORIGIN])

    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": PRODUCTION_ORIGIN,
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.headers.get("access-control-allow-origin") == PRODUCTION_ORIGIN


def test_credentials_not_enabled_in_cors_preflight_response(client: TestClient):
    """allow_credentials=False means Access-Control-Allow-Credentials must be absent."""
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": LOCALHOST_ORIGIN,
            "Access-Control-Request-Method": "GET",
        },
    )
    assert "access-control-allow-credentials" not in response.headers
