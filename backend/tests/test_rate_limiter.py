import time
from unittest.mock import MagicMock
import pytest
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.testclient import TestClient
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware

from app.database import get_db
from app.main import app
from app.models.contact import ContactInquiry
from app.utils.rate_limiter import (
    InMemoryRateLimiter,
    contact_limiter,
    newsletter_limiter,
    resolve_client_ip,
)


@pytest.fixture(autouse=True)
def reset_global_rate_limiters():
    contact_limiter.reset()
    newsletter_limiter.reset()
    yield
    contact_limiter.reset()
    newsletter_limiter.reset()


# ============================================================================
# 1. Unit Tests for InMemoryRateLimiter
# ============================================================================

def test_rate_limiter_allows_up_to_max():
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)
    client_ip = "192.0.2.1"

    # 3 requests allowed
    limiter.check_rate_limit(client_ip)
    limiter.check_rate_limit(client_ip)
    limiter.check_rate_limit(client_ip)
    assert len(limiter.requests[client_ip]) == 3


def test_rate_limiter_blocks_on_excess():
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=60)
    client_ip = "192.0.2.2"

    limiter.check_rate_limit(client_ip)
    limiter.check_rate_limit(client_ip)

    with pytest.raises(HTTPException) as exc_info:
        limiter.check_rate_limit(client_ip)

    assert exc_info.value.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many submissions" in exc_info.value.detail


def test_rate_limiter_isolated_per_ip():
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60)
    ip_a = "192.0.2.10"
    ip_b = "192.0.2.20"

    limiter.check_rate_limit(ip_a)
    # ip_a blocked
    with pytest.raises(HTTPException):
        limiter.check_rate_limit(ip_a)

    # ip_b still allowed
    limiter.check_rate_limit(ip_b)


def test_safe_handling_missing_and_unknown_ip():
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60)

    # Missing / None / empty / whitespace / "unknown" should be safely bypassed without crashing or creating entries
    for unresolvable in [None, "", "   ", "unknown"]:
        limiter.check_rate_limit(unresolvable)
        limiter.check_rate_limit(unresolvable)

    assert len(limiter.requests) == 0


def test_expired_entry_removal():
    limiter = InMemoryRateLimiter(max_requests=2, window_seconds=10)
    client_ip = "192.0.2.30"

    # Simulate 2 requests recorded 15 seconds ago (expired)
    past_time = time.time() - 15
    limiter.requests[client_ip] = [past_time, past_time + 1]

    # New request arrives; old entries should be expired and purged
    limiter.check_rate_limit(client_ip)

    # Request succeeds, only the new timestamp remains
    assert len(limiter.requests[client_ip]) == 1


def test_bulk_stale_entry_cleanup_threshold():
    # Set max_tracked_ips low to test trigger
    limiter = InMemoryRateLimiter(max_requests=5, window_seconds=10, max_tracked_ips=3)
    now = time.time()

    # Prepopulate with 4 IPs where 3 are expired
    limiter.requests["expired.1"] = [now - 20]
    limiter.requests["expired.2"] = [now - 25]
    limiter.requests["expired.3"] = [now - 30]
    limiter.requests["active.1"] = [now - 2]

    assert len(limiter.requests) == 4

    # Trigger rate limit check which invokes bulk cleanup because len > max_tracked_ips (3)
    limiter.check_rate_limit("new.client")

    # Expired entries should be purged, active and new retained
    assert "expired.1" not in limiter.requests
    assert "expired.2" not in limiter.requests
    assert "expired.3" not in limiter.requests
    assert "active.1" in limiter.requests
    assert "new.client" in limiter.requests


def test_cleanup_stale_entries_direct():
    limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)
    now = 1000.0

    limiter.requests["stale.1"] = [900.0]        # 100s ago (> 60s) -> stale
    limiter.requests["stale.2"] = [920.0, 935.0] # 65s ago (> 60s) -> stale
    limiter.requests["active.1"] = [970.0]       # 30s ago (<= 60s) -> active
    limiter.requests["empty"] = []               # empty -> stale

    purged = limiter.cleanup_stale_entries(now=now)
    assert purged == 3
    assert set(limiter.requests.keys()) == {"active.1"}


def test_rate_limiter_reset():
    limiter = InMemoryRateLimiter(max_requests=5, window_seconds=60)
    limiter.requests["192.0.2.1"] = [time.time()]
    limiter.requests["192.0.2.2"] = [time.time()]

    limiter.reset()
    assert len(limiter.requests) == 0


# ============================================================================
# 2. Client IP Resolution & Header Spoofing Tests
# ============================================================================

def test_resolve_client_ip_valid():
    request = MagicMock(spec=Request)
    request.client.host = "203.0.113.55"
    assert resolve_client_ip(request) == "203.0.113.55"


def test_resolve_client_ip_missing_client():
    request = MagicMock(spec=Request)
    request.client = None
    assert resolve_client_ip(request) is None


def test_resolve_client_ip_unknown_or_blank():
    for host_val in ["unknown", "  ", "", None]:
        request = MagicMock(spec=Request)
        request.client.host = host_val
        assert resolve_client_ip(request) is None


def test_resolve_client_ip_does_not_blindly_trust_raw_headers():
    """
    resolve_client_ip must not read arbitrary headers like X-Forwarded-For
    directly from request.headers, relying solely on request.client.host
    (which is safely populated by ASGI server / trusted proxy middleware).
    """
    request = MagicMock(spec=Request)
    request.client.host = "127.0.0.1"
    request.headers = {
        "x-forwarded-for": "198.51.100.99",
        "cf-connecting-ip": "198.51.100.100",
    }
    # Direct resolution must return request.client.host, not the spoofed header
    assert resolve_client_ip(request) == "127.0.0.1"


# ============================================================================
# 3. Trusted ProxyHeadersMiddleware Integration Tests
# ============================================================================

def test_proxy_headers_middleware_resolves_client_ip():
    """
    When behind a trusted proxy with ProxyHeadersMiddleware configured,
    Uvicorn updates request.client.host with the forwarded address.
    """
    test_app = FastAPI()
    test_app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

    @test_app.get("/ip")
    def get_ip(request: Request):
        return {"resolved_ip": resolve_client_ip(request)}

    client = TestClient(test_app)

    # Direct request with no proxy header
    res_direct = client.get("/ip")
    assert res_direct.json()["resolved_ip"] == "testclient"

    # Forwarded request through trusted proxy
    res_proxied = client.get("/ip", headers={"x-forwarded-for": "203.0.113.88"})
    assert res_proxied.json()["resolved_ip"] == "203.0.113.88"


# ============================================================================
# 4. Route Rate Limiting Integration Tests (Contact & Newsletter)
# ============================================================================

def test_contact_rate_limit_enforcement(client):
    """Contact route enforces limit of 5 requests per 60s per client IP."""
    submitting_client = TestClient(app, client=("198.51.100.10", 50000))

    # 5 requests succeed
    for i in range(5):
        res = submitting_client.post(
            "/api/v1/contact",
            json={
                "name": f"Tester {i}",
                "email": f"tester{i}@example.com",
                "message": f"Message inquiry number {i} with sufficient length.",
            },
        )
        assert res.status_code == status.HTTP_201_CREATED

    # 6th request is rate-limited (HTTP 429)
    res_blocked = submitting_client.post(
        "/api/v1/contact",
        json={
            "name": "Tester 6",
            "email": "tester6@example.com",
            "message": "This message should be rate limited by contact limiter.",
        },
    )
    assert res_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many submissions" in res_blocked.json()["detail"]

    # Another client IP is NOT blocked
    other_client = TestClient(app, client=("198.51.100.20", 50000))
    res_other = other_client.post(
        "/api/v1/contact",
        json={
            "name": "Different User",
            "email": "different@example.com",
            "message": "Different client IP should still be allowed through.",
        },
    )
    assert res_other.status_code == status.HTTP_201_CREATED


def test_contact_records_client_ip_in_db(client, db_session):
    submitting_client = TestClient(app, client=("198.51.100.77", 50000))

    res = submitting_client.post(
        "/api/v1/contact",
        json={
            "name": "IP Tracking Test",
            "email": "trackip@example.com",
            "message": "Testing that the client IP is stored correctly in DB.",
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    inquiry_id = res.json()["id"]

    record = db_session.query(ContactInquiry).filter(ContactInquiry.id == inquiry_id).first()
    assert record is not None
    assert record.ip_address == "198.51.100.77"


def test_newsletter_rate_limit_enforcement(client):
    """Newsletter route enforces limit of 10 requests per 60s per client IP."""
    submitting_client = TestClient(app, client=("198.51.100.30", 50000))

    # 10 requests succeed
    for i in range(10):
        res = submitting_client.post(
            "/api/v1/newsletter/subscribe",
            json={"email": f"subscriber_{i}@example.com"},
        )
        assert res.status_code == status.HTTP_201_CREATED

    # 11th request is rate-limited (HTTP 429)
    res_blocked = submitting_client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "subscriber_11@example.com"},
    )
    assert res_blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS
    assert "Too many submissions" in res_blocked.json()["detail"]

    # Another client IP is NOT blocked
    other_client = TestClient(app, client=("198.51.100.40", 50000))
    res_other = other_client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "fresh_subscriber@example.com"},
    )
    assert res_other.status_code == status.HTTP_201_CREATED


def test_contact_and_newsletter_missing_client_address_safe(client):
    """When client IP is unresolvable or missing, requests proceed safely without crashing."""
    bare_client = TestClient(app, client=None)
    res_contact = bare_client.post(
        "/api/v1/contact",
        json={
            "name": "No IP User",
            "email": "noip@example.com",
            "message": "Testing submission without an available client IP.",
        },
    )
    assert res_contact.status_code == status.HTTP_201_CREATED

    res_news = bare_client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "noip_subscriber@example.com"},
    )
    assert res_news.status_code == status.HTTP_201_CREATED