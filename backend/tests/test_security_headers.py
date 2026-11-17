from fastapi import status
from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.main import app

BASELINE_HEADERS = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "strict-origin-when-cross-origin",
    "permissions-policy": "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
}


def test_baseline_security_headers_on_api_response(client):
    """Verify all four baseline security headers are present on normal API responses."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK

    for header, expected_value in BASELINE_HEADERS.items():
        assert header in response.headers
        assert response.headers[header] == expected_value


def test_baseline_security_headers_on_root_index(client):
    """Verify security headers are present on root endpoint."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK

    for header, expected_value in BASELINE_HEADERS.items():
        assert response.headers.get(header) == expected_value


def test_hsts_absent_on_plain_http(client):
    """Verify HSTS is NOT emitted for plain HTTP requests."""
    response = client.get("/api/v1/health")
    assert response.status_code == status.HTTP_200_OK
    assert "strict-transport-security" not in response.headers


def test_hsts_present_on_https_request():
    """Verify HSTS is emitted when request scheme is HTTPS."""
    https_client = TestClient(app, base_url="https://testserver")
    response = https_client.get("/api/v1/health")

    assert response.status_code == status.HTTP_200_OK
    assert "strict-transport-security" in response.headers
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"

    # Baseline headers must also be present
    for header, expected_value in BASELINE_HEADERS.items():
        assert response.headers.get(header) == expected_value


def test_raw_forwarded_proto_not_trusted_without_proxy_middleware(client):
    """
    Application code does not directly trust the raw X-Forwarded-Proto header.
    Without proxy middleware processing, an HTTP request with X-Forwarded-Proto: https
    must NOT emit HSTS.
    """
    response = client.get("/api/v1/health", headers={"x-forwarded-proto": "https"})
    assert response.status_code == status.HTTP_200_OK
    assert "strict-transport-security" not in response.headers


def test_hsts_with_trusted_proxy_headers_middleware():
    """
    When behind a trusted proxy, Uvicorn's ProxyHeadersMiddleware safely updates
    the request scheme to HTTPS, triggering HSTS.
    """
    # Wrap app with trusted proxy middleware
    proxied_app = ProxyHeadersMiddleware(app, trusted_hosts="*")
    proxied_client = TestClient(proxied_app, base_url="http://testserver")

    response = proxied_client.get(
        "/api/v1/health",
        headers={"x-forwarded-proto": "https"}
    )
    assert response.status_code == status.HTTP_200_OK
    assert "strict-transport-security" in response.headers
    assert response.headers["strict-transport-security"] == "max-age=31536000; includeSubDomains"


def test_security_headers_on_cors_preflight(client):
    """Verify security headers are present on CORS preflight OPTIONS requests."""
    response = client.options(
        "/api/v1/contact",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )
    assert response.status_code == status.HTTP_200_OK

    # CORS header should be intact
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"

    # Baseline security headers must also be present
    for header, expected_value in BASELINE_HEADERS.items():
        assert response.headers.get(header) == expected_value


def test_security_headers_on_error_responses(client):
    """Verify security headers are present on 404 and 422 error responses."""
    # 404 Not Found
    res_404 = client.get("/api/v1/nonexistent-route")
    assert res_404.status_code == status.HTTP_404_NOT_FOUND
    for header, expected_value in BASELINE_HEADERS.items():
        assert res_404.headers.get(header) == expected_value

    # 422 Unprocessable Entity
    res_422 = client.post("/api/v1/newsletter/subscribe", json={"email": "invalid"})
    assert res_422.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    for header, expected_value in BASELINE_HEADERS.items():
        assert res_422.headers.get(header) == expected_value


def test_docs_endpoints_accessible_with_security_headers(client):
    """
    Verify Swagger UI (/docs), ReDoc (/redoc), and OpenAPI schema (/openapi.json)
    remain accessible and include security headers.
    """
    endpoints = ["/docs", "/redoc", "/openapi.json"]

    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == status.HTTP_200_OK, f"Failed for {endpoint}"

        for header, expected_value in BASELINE_HEADERS.items():
            assert response.headers.get(header) == expected_value, (
                f"Missing or mismatched {header} on {endpoint}"
            )


def test_production_security_headers_on_unhandled_500_response():
    """
    Verify security headers are present on genuine unhandled HTTP 500 responses
    generated by the production application and its global exception handler.
    Triggers an unhandled exception by overriding the get_db dependency on the contact route.
    """
    from app.database import get_db

    def failing_db():
        raise RuntimeError("Simulated production database crash")

    saved_overrides = app.dependency_overrides.copy()
    app.dependency_overrides[get_db] = failing_db
    try:
        # 1. Plain HTTP request -> baseline headers present, HSTS absent
        client_http = TestClient(app, base_url="http://testserver", raise_server_exceptions=False)
        response_http = client_http.post(
            "/api/v1/contact",
            json={
                "name": "Crash Test",
                "email": "crashtest@example.com",
                "message": "Testing unhandled exception in contact submission.",
            },
        )
        assert response_http.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response_http.json() == {
            "detail": "An unexpected error occurred. Please try again later."
        }
        for header, expected_value in BASELINE_HEADERS.items():
            assert response_http.headers.get(header) == expected_value
        assert "strict-transport-security" not in response_http.headers

        # 2. HTTPS request -> baseline headers present AND HSTS present
        client_https = TestClient(app, base_url="https://testserver", raise_server_exceptions=False)
        response_https = client_https.post(
            "/api/v1/contact",
            json={
                "name": "Crash Test HTTPS",
                "email": "crashtest_https@example.com",
                "message": "Testing unhandled exception over HTTPS connection.",
            },
        )
        assert response_https.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
        assert response_https.json() == {
            "detail": "An unexpected error occurred. Please try again later."
        }
        for header, expected_value in BASELINE_HEADERS.items():
            assert response_https.headers.get(header) == expected_value
        assert (
            response_https.headers.get("strict-transport-security")
            == "max-age=31536000; includeSubDomains"
        )
    finally:
        app.dependency_overrides.clear()
        app.dependency_overrides.update(saved_overrides)
