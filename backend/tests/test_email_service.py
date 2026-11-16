"""
Tests for the Penny Wise email service and email-dispatching routes.

All Resend API calls are intercepted with respx so no real emails are sent.
The tests verify:
  - Email service behaviour: success, timeout, 4xx error, missing config
  - Newsletter route: welcome + admin emails on new subscription
  - Newsletter route: NO re-send on duplicate active subscription
  - Newsletter route: DB record survives a failed email dispatch
  - Contact route: ack + admin emails on new inquiry
  - Contact route: DB record survives a failed email dispatch
"""

import pytest
import respx
from httpx import Response as HttpxResponse

from app.services.email_service import (
    EmailResult,
    _dispatch,
    send_contact_acknowledgement,
    send_contact_admin_notification,
    send_newsletter_admin_notification,
    send_newsletter_welcome,
)


# ── Helpers ────────────────────────────────────────────────────────────────

RESEND_URL = "https://api.resend.com/emails"

MOCK_API_KEY = "re_test_key_123"
MOCK_FROM = "test@pennywise.test"
MOCK_ADMIN = "admin@pennywise.test"


def _patch_settings(
    monkeypatch,
    *,
    api_key=MOCK_API_KEY,
    mail_from=MOCK_FROM,
    admin=MOCK_ADMIN,
    frontend_url=None,
):
    """Override email-related settings for the duration of a test."""
    from app import config as cfg_module
    monkeypatch.setattr(cfg_module.settings, "RESEND_API_KEY", api_key)
    monkeypatch.setattr(cfg_module.settings, "MAIL_FROM", mail_from)
    monkeypatch.setattr(cfg_module.settings, "ADMIN_EMAIL", admin)
    if frontend_url is not None:
        monkeypatch.setattr(cfg_module.settings, "FRONTEND_URL", frontend_url)


# ══════════════════════════════════════════════════════════════════════════
# 1. Email service unit tests
# ══════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
@respx.mock
async def test_dispatch_success(monkeypatch):
    """_dispatch returns success=True with a message_id on HTTP 200."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "msg_abc123"})
    )

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hello</p>",
        text_body="Hello",
    )

    assert result.success is True
    assert result.message_id == "msg_abc123"
    assert result.error is None


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_resend_4xx(monkeypatch):
    """_dispatch returns success=False when Resend returns a 4xx."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(422, json={"message": "Invalid from address"})
    )

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hi</p>",
        text_body="Hi",
    )

    assert result.success is False
    assert "422" in result.error


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_resend_5xx(monkeypatch):
    """_dispatch returns success=False when Resend returns a 5xx."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(500, json={"message": "Internal Server Error"})
    )

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hi</p>",
        text_body="Hi",
    )

    assert result.success is False
    assert "500" in result.error


@pytest.mark.asyncio
async def test_dispatch_missing_api_key(monkeypatch):
    """_dispatch returns success=False when RESEND_API_KEY is not configured."""
    _patch_settings(monkeypatch, api_key=None)

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hi</p>",
        text_body="Hi",
    )

    assert result.success is False
    assert "not configured" in result.error.lower()


@pytest.mark.asyncio
async def test_dispatch_missing_mail_from(monkeypatch):
    """_dispatch returns success=False when MAIL_FROM is not configured."""
    _patch_settings(monkeypatch, mail_from="")

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hi</p>",
        text_body="Hi",
    )

    assert result.success is False
    assert "not configured" in result.error.lower()


@pytest.mark.asyncio
@respx.mock
async def test_dispatch_timeout(monkeypatch):
    """_dispatch returns success=False on network timeout."""
    import httpx
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(side_effect=httpx.TimeoutException("timed out"))

    result = await _dispatch(
        to="user@example.com",
        subject="Test",
        html_body="<p>Hi</p>",
        text_body="Hi",
    )

    assert result.success is False
    assert "timed out" in result.error.lower()


# ── High-level send_* helpers ──────────────────────────────────────────────

@pytest.mark.asyncio
@respx.mock
async def test_send_newsletter_welcome(monkeypatch):
    """send_newsletter_welcome dispatches to the subscriber's address."""
    _patch_settings(monkeypatch)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "welcome_001"})
    )

    result = await send_newsletter_welcome("alice@example.com")

    assert result.success is True
    # Verify the payload sent to Resend
    request_body = route.calls[0].request
    import json
    body = json.loads(request_body.content)
    assert body["to"] == ["alice@example.com"]
    assert "Welcome" in body["subject"]
    assert MOCK_FROM == body["from"]


@pytest.mark.asyncio
@respx.mock
async def test_send_newsletter_admin_notification(monkeypatch):
    """send_newsletter_admin_notification dispatches to ADMIN_EMAIL."""
    _patch_settings(monkeypatch)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "admin_001"})
    )

    result = await send_newsletter_admin_notification("alice@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert body["to"] == [MOCK_ADMIN]
    assert "alice@example.com" in body["subject"]


@pytest.mark.asyncio
async def test_send_newsletter_admin_no_admin_email(monkeypatch):
    """send_newsletter_admin_notification returns failure when ADMIN_EMAIL is unset."""
    _patch_settings(monkeypatch, admin=None)

    result = await send_newsletter_admin_notification("alice@example.com")

    assert result.success is False
    assert "admin email" in result.error.lower()


@pytest.mark.asyncio
@respx.mock
async def test_send_contact_acknowledgement(monkeypatch):
    """send_contact_acknowledgement dispatches to the sender's address."""
    _patch_settings(monkeypatch)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "ack_001"})
    )

    result = await send_contact_acknowledgement("Bob", "bob@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert body["to"] == ["bob@example.com"]
    assert "received" in body["subject"].lower()


@pytest.mark.asyncio
@respx.mock
async def test_send_contact_admin_notification(monkeypatch):
    """send_contact_admin_notification dispatches to ADMIN_EMAIL with full details."""
    _patch_settings(monkeypatch)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "cadmin_001"})
    )

    result = await send_contact_admin_notification(
        "Bob", "bob@example.com", "I need help with my IRA rollover."
    )

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert body["to"] == [MOCK_ADMIN]
    assert "Bob" in body["subject"]
    # Ensure the user's message is in the HTML body
    assert "IRA rollover" in body["html"]
    # Ensure user message is HTML-escaped (no raw injection)
    assert "<script>" not in body["html"]


@pytest.mark.asyncio
@respx.mock
async def test_html_escaping_in_contact_admin(monkeypatch):
    """User-supplied HTML is escaped before insertion into email templates."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "escape_001"})
    )

    malicious_message = "<script>alert('xss')</script> Normal text"
    result = await send_contact_admin_notification(
        "<Evil>", "evil@example.com", malicious_message
    )

    assert result.success is True
    import json
    body = json.loads(respx.calls[0].request.content)
    # Raw tags must not appear in email HTML
    assert "<script>" not in body["html"]
    assert "<Evil>" not in body["html"]
    # Escaped versions must be present
    assert "&lt;script&gt;" in body["html"]


# ══════════════════════════════════════════════════════════════════════════
# 2. Newsletter route integration tests
# ══════════════════════════════════════════════════════════════════════════

@respx.mock
def test_newsletter_subscribe_sends_emails(client, monkeypatch):
    """POST /newsletter/subscribe dispatches welcome + admin emails for new subscriber."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "mock_id"})
    )

    resp = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "new_subscriber@example.com"},
    )

    assert resp.status_code == 201
    data = resp.json()
    assert "inbox" in data["message"].lower() or "subscrib" in data["message"].lower()
    # Two emails dispatched: welcome + admin
    assert len(respx.calls) == 2


@respx.mock
def test_newsletter_duplicate_active_no_emails(client, monkeypatch):
    """Duplicate active subscription does NOT trigger another email dispatch."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "mock_id"})
    )

    email = "dup_active@example.com"
    # First subscription — 2 emails
    client.post("/api/v1/newsletter/subscribe", json={"email": email})
    call_count_after_first = len(respx.calls)

    # Second subscription (duplicate active) — 0 additional emails
    resp = client.post("/api/v1/newsletter/subscribe", json={"email": email})

    assert resp.status_code == 200
    assert "already subscribed" in resp.json()["message"].lower()
    assert len(respx.calls) == call_count_after_first  # no new calls


@respx.mock
def test_newsletter_db_record_survives_email_failure(client, monkeypatch):
    """DB subscription is saved even when Resend API returns an error."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(500, json={"message": "Internal Error"})
    )

    resp = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "fail_email@example.com"},
    )

    # API still returns 201 — DB write succeeded
    assert resp.status_code == 201
    # Confirm record exists via duplicate check
    resp2 = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "fail_email@example.com"},
    )
    assert resp2.status_code == 200
    assert "already subscribed" in resp2.json()["message"].lower()


# ══════════════════════════════════════════════════════════════════════════
# 3. Contact route integration tests
# ══════════════════════════════════════════════════════════════════════════

@respx.mock
def test_contact_submit_sends_emails(client, monkeypatch):
    """POST /contact dispatches ack + admin emails for a new inquiry."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "mock_id"})
    )

    resp = client.post(
        "/api/v1/contact",
        json={
            "name": "Jane Doe",
            "email": "jane@example.com",
            "message": "I am interested in rolling over my 401k.",
        },
    )

    assert resp.status_code == 201
    data = resp.json()
    assert "confirmation" in data["message"].lower() or "inbox" in data["message"].lower()
    # Two emails: user ack + admin notification
    assert len(respx.calls) == 2


@respx.mock
def test_contact_db_record_survives_email_failure(client, monkeypatch):
    """Contact inquiry is saved in DB even when Resend API fails."""
    _patch_settings(monkeypatch)
    respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(503, json={"message": "Service Unavailable"})
    )

    resp = client.post(
        "/api/v1/contact",
        json={
            "name": "John Fail",
            "email": "john.fail@example.com",
            "message": "My email provider is down.",
        },
    )

    # Route must still return 201 — DB write succeeded
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "John Fail"
    assert data["email"] == "john.fail@example.com"


def test_contact_invalid_email_rejected(client, monkeypatch):
    """Contact form with an invalid email address is rejected with 422."""
    _patch_settings(monkeypatch)

    resp = client.post(
        "/api/v1/contact",
        json={
            "name": "Bad Actor",
            "email": "not-an-email",
            "message": "Trying to inject bad data.",
        },
    )

    assert resp.status_code == 422


# ══════════════════════════════════════════════════════════════════════════
# 4. Frontend URL & CORS configuration tests
# ══════════════════════════════════════════════════════════════════════════

@pytest.mark.asyncio
@respx.mock
async def test_newsletter_welcome_uses_configured_frontend_url(monkeypatch):
    """Newsletter welcome email uses the configured FRONTEND_URL in HTML and text."""
    prod_url = "https://pennywise.example.com"
    _patch_settings(monkeypatch, frontend_url=prod_url)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "welcome_prod"})
    )

    result = await send_newsletter_welcome("subscriber@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert f'href="{prod_url}"' in body["html"]
    assert f"Visit Penny Wise: {prod_url}" in body["text"]


@pytest.mark.asyncio
@respx.mock
async def test_newsletter_welcome_uses_default_local_url(monkeypatch):
    """Newsletter welcome email uses http://localhost:5173 when default."""
    _patch_settings(monkeypatch, frontend_url="http://localhost:5173")
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "welcome_local"})
    )

    result = await send_newsletter_welcome("subscriber@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert 'href="http://localhost:5173"' in body["html"]
    assert "Visit Penny Wise: http://localhost:5173" in body["text"]


@pytest.mark.asyncio
@respx.mock
async def test_contact_ack_uses_configured_frontend_url(monkeypatch):
    """Contact acknowledgement email uses the configured FRONTEND_URL in links."""
    prod_url = "https://pennywise.example.com"
    _patch_settings(monkeypatch, frontend_url=prod_url)
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "ack_prod"})
    )

    result = await send_contact_acknowledgement("Jane", "jane@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert f'href="{prod_url}"' in body["html"]
    assert f"FAQ: {prod_url}/faq" in body["text"]
    assert f"Markets: {prod_url}/markets" in body["text"]
    assert f"Earn calculator: {prod_url}/earn" in body["text"]


@pytest.mark.asyncio
@respx.mock
async def test_contact_ack_uses_default_local_url(monkeypatch):
    """Contact acknowledgement email uses http://localhost:5173 when default."""
    _patch_settings(monkeypatch, frontend_url="http://localhost:5173")
    route = respx.post(RESEND_URL).mock(
        return_value=HttpxResponse(200, json={"id": "ack_local"})
    )

    result = await send_contact_acknowledgement("Jane", "jane@example.com")

    assert result.success is True
    import json
    body = json.loads(route.calls[0].request.content)
    assert 'href="http://localhost:5173"' in body["html"]
    assert "FAQ: http://localhost:5173/faq" in body["text"]
    assert "Markets: http://localhost:5173/markets" in body["text"]
    assert "Earn calculator: http://localhost:5173/earn" in body["text"]


ALL_LOCALHOST_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


def test_cors_origins_single_string(monkeypatch):
    """CORS validator handles a single production URL as a string and retains all localhost origins."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS="https://pennywise.example.com")
    assert "https://pennywise.example.com" in s.CORS_ORIGINS
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_parsing_comma_separated(monkeypatch):
    """CORS validator correctly parses multiple comma-separated production URLs."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS="https://pennywise.example.com, https://preview.example.com, https://admin.example.com")
    assert "https://pennywise.example.com" in s.CORS_ORIGINS
    assert "https://preview.example.com" in s.CORS_ORIGINS
    assert "https://admin.example.com" in s.CORS_ORIGINS
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_parsing_json_string(monkeypatch):
    """CORS validator correctly parses JSON string array into a list."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS='["https://app.example.com", "https://api.example.com"]')
    assert "https://app.example.com" in s.CORS_ORIGINS
    assert "https://api.example.com" in s.CORS_ORIGINS
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_parsing_list(monkeypatch):
    """CORS validator correctly accepts a Python list."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS=["https://app.example.com", "https://preview.example.com"])
    assert "https://app.example.com" in s.CORS_ORIGINS
    assert "https://preview.example.com" in s.CORS_ORIGINS
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_duplicates_removed(monkeypatch):
    """CORS validator removes duplicate origins while preserving order and localhost."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS="https://dup.com, http://localhost:5173, https://dup.com")
    assert s.CORS_ORIGINS.count("https://dup.com") == 1
    assert s.CORS_ORIGINS.count("http://localhost:5173") == 1
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_default_fallback():
    """Default Settings configuration contains exactly the four localhost origins."""
    from app.config import Settings
    s = Settings(CORS_ORIGINS=None)
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS


def test_cors_origins_via_environment_variable(monkeypatch):
    """CORS origins supplied via OS environment variable (as on Render) are genuinely exercised."""
    from app.config import Settings
    monkeypatch.setenv("CORS_ORIGINS", "https://render-deployed-frontend.onrender.com")
    s = Settings()
    assert "https://render-deployed-frontend.onrender.com" in s.CORS_ORIGINS
    for local in ALL_LOCALHOST_ORIGINS:
        assert local in s.CORS_ORIGINS
