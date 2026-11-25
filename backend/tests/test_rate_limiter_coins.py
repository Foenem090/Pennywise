"""
Rate-limit integration tests for public market-data endpoints:
  GET  /api/v1/coins
  GET  /api/v1/coins/search
  GET  /api/v1/calculator/rates
  POST /api/v1/calculator/estimate

Covers:
  - Each endpoint's configured limit.
  - HTTP 429 after exceeding the limit.
  - Independent client IPs (one blocked IP does not affect another).
  - Independent endpoint counters (coins limit does not bleed into search, etc.).
  - Normal successful responses for all four endpoints.
  - Existing contact and newsletter rate limits remain unchanged.
  - Health endpoint is NOT rate limited.
"""

from unittest.mock import AsyncMock

import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.main import app
from app.services.email_service import EmailResult
from app.utils.rate_limiter import (
    coins_limiter,
    search_limiter,
    calculator_estimate_limiter,
    calculator_rates_limiter,
    contact_limiter,
    newsletter_limiter,
)


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def reset_all_limiters():
    """Reset every limiter before and after each test for complete isolation."""
    coins_limiter.reset()
    search_limiter.reset()
    calculator_estimate_limiter.reset()
    calculator_rates_limiter.reset()
    contact_limiter.reset()
    newsletter_limiter.reset()
    yield
    coins_limiter.reset()
    search_limiter.reset()
    calculator_estimate_limiter.reset()
    calculator_rates_limiter.reset()
    contact_limiter.reset()
    newsletter_limiter.reset()


def _client_for(ip: str) -> TestClient:
    """Return a TestClient whose ASGI scope presents the given client IP."""
    return TestClient(app, client=(ip, 50000))


# ---------------------------------------------------------------------------
# 1. Normal successful responses
# ---------------------------------------------------------------------------

class TestNormalResponses:
    def test_get_coins_success(self, client):
        res = client.get("/api/v1/coins")
        assert res.status_code == status.HTTP_200_OK
        assert "coins" in res.json()

    def test_search_coins_success(self, client):
        res = client.get("/api/v1/coins/search?q=btc")
        assert res.status_code == status.HTTP_200_OK
        assert "coins" in res.json()

    def test_calculator_rates_success(self, client):
        res = client.get("/api/v1/calculator/rates")
        assert res.status_code == status.HTTP_200_OK
        assert "rates" in res.json()

    def test_calculator_estimate_success(self, client):
        res = client.post(
            "/api/v1/calculator/estimate",
            json={"asset": "USDC", "amount": 1000.0},
        )
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["asset"] == "USDC"
        assert data["amount"] == 1000.0

    def test_health_always_accessible(self, client):
        """Health endpoint must never be rate limited."""
        for _ in range(5):
            res = client.get("/api/v1/health")
            assert res.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 2. Rate-limit enforcement per endpoint
# ---------------------------------------------------------------------------

class TestCoinsRateLimit:
    """GET /api/v1/coins — limit: 30 req / 60 s per IP."""

    LIMIT = 30

    def test_allows_up_to_limit(self):
        tc = _client_for("10.0.0.1")
        for _ in range(self.LIMIT):
            res = tc.get("/api/v1/coins")
            assert res.status_code == status.HTTP_200_OK

    def test_blocks_on_excess(self):
        tc = _client_for("10.0.0.2")
        for _ in range(self.LIMIT):
            tc.get("/api/v1/coins")

        res = tc.get("/api/v1/coins")
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Too many submissions" in res.json()["detail"]

    def test_different_ip_not_blocked(self):
        blocked = _client_for("10.0.0.3")
        allowed = _client_for("10.0.0.4")

        for _ in range(self.LIMIT + 1):
            blocked.get("/api/v1/coins")

        res = allowed.get("/api/v1/coins")
        assert res.status_code == status.HTTP_200_OK


class TestSearchRateLimit:
    """GET /api/v1/coins/search — limit: 30 req / 60 s per IP."""

    LIMIT = 30

    def test_allows_up_to_limit(self):
        tc = _client_for("10.1.0.1")
        for _ in range(self.LIMIT):
            res = tc.get("/api/v1/coins/search?q=eth")
            assert res.status_code == status.HTTP_200_OK

    def test_blocks_on_excess(self):
        tc = _client_for("10.1.0.2")
        for _ in range(self.LIMIT):
            tc.get("/api/v1/coins/search?q=eth")

        res = tc.get("/api/v1/coins/search?q=eth")
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS
        assert "Too many submissions" in res.json()["detail"]

    def test_different_ip_not_blocked(self):
        blocked = _client_for("10.1.0.3")
        allowed = _client_for("10.1.0.4")

        for _ in range(self.LIMIT + 1):
            blocked.get("/api/v1/coins/search?q=eth")

        res = allowed.get("/api/v1/coins/search?q=eth")
        assert res.status_code == status.HTTP_200_OK


class TestCalculatorRatesRateLimit:
    """GET /api/v1/calculator/rates — limit: 60 req / 60 s per IP."""

    LIMIT = 60

    def test_allows_up_to_limit(self):
        tc = _client_for("10.2.0.1")
        for _ in range(self.LIMIT):
            res = tc.get("/api/v1/calculator/rates")
            assert res.status_code == status.HTTP_200_OK

    def test_blocks_on_excess(self):
        tc = _client_for("10.2.0.2")
        for _ in range(self.LIMIT):
            tc.get("/api/v1/calculator/rates")

        res = tc.get("/api/v1/calculator/rates")
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_different_ip_not_blocked(self):
        blocked = _client_for("10.2.0.3")
        allowed = _client_for("10.2.0.4")

        for _ in range(self.LIMIT + 1):
            blocked.get("/api/v1/calculator/rates")

        res = allowed.get("/api/v1/calculator/rates")
        assert res.status_code == status.HTTP_200_OK


class TestCalculatorEstimateRateLimit:
    """POST /api/v1/calculator/estimate — limit: 30 req / 60 s per IP."""

    LIMIT = 30
    PAYLOAD = {"asset": "USDC", "amount": 500.0}

    def test_allows_up_to_limit(self):
        tc = _client_for("10.3.0.1")
        for _ in range(self.LIMIT):
            res = tc.post("/api/v1/calculator/estimate", json=self.PAYLOAD)
            assert res.status_code == status.HTTP_200_OK

    def test_blocks_on_excess(self):
        tc = _client_for("10.3.0.2")
        for _ in range(self.LIMIT):
            tc.post("/api/v1/calculator/estimate", json=self.PAYLOAD)

        res = tc.post("/api/v1/calculator/estimate", json=self.PAYLOAD)
        assert res.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_different_ip_not_blocked(self):
        blocked = _client_for("10.3.0.3")
        allowed = _client_for("10.3.0.4")

        for _ in range(self.LIMIT + 1):
            blocked.post("/api/v1/calculator/estimate", json=self.PAYLOAD)

        res = allowed.post("/api/v1/calculator/estimate", json=self.PAYLOAD)
        assert res.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 3. Independent endpoint counters
# ---------------------------------------------------------------------------

class TestIndependentEndpointCounters:
    """Exhaust one endpoint's limit; confirm the others remain unaffected."""

    def test_exhausting_coins_does_not_block_search(self):
        tc = _client_for("10.4.0.1")
        # Exhaust coins limit
        for _ in range(30):
            tc.get("/api/v1/coins")
        assert tc.get("/api/v1/coins").status_code == status.HTTP_429_TOO_MANY_REQUESTS

        # Search counter is independent — still allowed
        res = tc.get("/api/v1/coins/search?q=sol")
        assert res.status_code == status.HTTP_200_OK

    def test_exhausting_search_does_not_block_coins(self):
        tc = _client_for("10.4.0.2")
        for _ in range(30):
            tc.get("/api/v1/coins/search?q=sol")
        assert tc.get("/api/v1/coins/search?q=sol").status_code == status.HTTP_429_TOO_MANY_REQUESTS

        res = tc.get("/api/v1/coins")
        assert res.status_code == status.HTTP_200_OK

    def test_exhausting_calculator_estimate_does_not_block_rates(self):
        tc = _client_for("10.4.0.3")
        payload = {"asset": "USDC", "amount": 100.0}
        for _ in range(30):
            tc.post("/api/v1/calculator/estimate", json=payload)
        assert tc.post("/api/v1/calculator/estimate", json=payload).status_code == status.HTTP_429_TOO_MANY_REQUESTS

        res = tc.get("/api/v1/calculator/rates")
        assert res.status_code == status.HTTP_200_OK

    def test_exhausting_coins_does_not_block_calculator(self):
        tc = _client_for("10.4.0.4")
        for _ in range(30):
            tc.get("/api/v1/coins")

        res = tc.post(
            "/api/v1/calculator/estimate",
            json={"asset": "USDC", "amount": 200.0},
        )
        assert res.status_code == status.HTTP_200_OK


# ---------------------------------------------------------------------------
# 4. Existing contact and newsletter limits remain unchanged
# ---------------------------------------------------------------------------

class TestExistingLimitsUnchanged:
    """Contact (5/60s) and newsletter (10/60s) limits must not be altered."""

    def test_contact_limit_still_5_per_60s(self):
        tc = _client_for("10.5.0.1")
        for i in range(5):
            res = tc.post(
                "/api/v1/contact",
                json={
                    "name": f"User {i}",
                    "email": f"user{i}@example.com",
                    "message": f"Test message number {i} with enough length.",
                },
            )
            assert res.status_code == status.HTTP_201_CREATED

        blocked = tc.post(
            "/api/v1/contact",
            json={
                "name": "User 6",
                "email": "user6@example.com",
                "message": "This should be rate limited by contact limiter.",
            },
        )
        assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_newsletter_limit_still_10_per_60s(self, monkeypatch):
        mock_result = EmailResult(success=True)
        monkeypatch.setattr(
            "app.routes.newsletter.send_newsletter_welcome",
            AsyncMock(return_value=mock_result),
        )
        monkeypatch.setattr(
            "app.routes.newsletter.send_newsletter_admin_notification",
            AsyncMock(return_value=mock_result),
        )

        tc = _client_for("10.5.0.2")
        for i in range(10):
            res = tc.post(
                "/api/v1/newsletter/subscribe",
                json={"email": f"subscriber_{i}@example.com"},
            )
            assert res.status_code == status.HTTP_201_CREATED

        blocked = tc.post(
            "/api/v1/newsletter/subscribe",
            json={"email": "subscriber_11@example.com"},
        )
        assert blocked.status_code == status.HTTP_429_TOO_MANY_REQUESTS

    def test_coin_endpoints_do_not_consume_contact_quota(self):
        """Exhausting coin requests must not burn through the contact submission budget."""
        tc = _client_for("10.5.0.3")
        for _ in range(30):
            tc.get("/api/v1/coins")

        # Contact submissions should still be allowed
        res = tc.post(
            "/api/v1/contact",
            json={
                "name": "Contact User",
                "email": "contact@example.com",
                "message": "Contact message after exhausting coin limit.",
            },
        )
        assert res.status_code == status.HTTP_201_CREATED
