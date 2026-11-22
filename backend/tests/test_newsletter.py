from unittest.mock import AsyncMock
import sqlite3

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Query

from app.main import app
from app.models.newsletter import NewsletterSubscriber
from app.services.email_service import EmailResult
from app.utils.rate_limiter import newsletter_limiter


@pytest.fixture(autouse=True)
def reset_newsletter_rate_limiter():
    newsletter_limiter.reset()
    yield
    newsletter_limiter.reset()


def test_subscribe_newsletter_success(client):
    response = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "crypto_investor@example.com"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "crypto_investor@example.com"
    assert "Thank you" in data["message"]


def test_subscribe_newsletter_duplicate(client):
    # First subscription
    client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "duplicate_check@example.com"}
    )
    # Second subscription attempt
    response = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "duplicate_check@example.com"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "already subscribed" in data["message"]


def test_subscribe_newsletter_invalid_email(client):
    response = client.post(
        "/api/v1/newsletter/subscribe",
        json={"email": "not-an-email"}
    )
    assert response.status_code == 422


def test_subscribe_newsletter_first_time_race_recovery(client, db_session, monkeypatch):
    """
    Simulate a concurrent transaction inserting the same normalized email
    before this request commits. Verify rollback, duplicate recovery HTTP 200,
    and zero email dispatches.
    """
    email = "first_race@example.com"
    mock_welcome = AsyncMock(return_value=EmailResult(success=True))
    mock_admin = AsyncMock(return_value=EmailResult(success=True))
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_welcome", mock_welcome)
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_admin_notification", mock_admin)

    original_commit = db_session.commit
    committed_concurrently = False

    def simulated_race_commit():
        nonlocal committed_concurrently
        if not committed_concurrently:
            committed_concurrently = True
            # Roll back pending insert in current session to simulate another session committed first
            db_session.rollback()
            concurrent_sub = NewsletterSubscriber(email=email, is_active=True)
            db_session.add(concurrent_sub)
            original_commit()
            # Raise an IntegrityError matching unique constraint violation
            orig_exc = sqlite3.IntegrityError("UNIQUE constraint failed: newsletter_subscribers.email")
            orig_exc.sqlite_errorname = "SQLITE_CONSTRAINT_UNIQUE"
            raise IntegrityError("INSERT INTO newsletter_subscribers", {}, orig_exc)
        return original_commit()

    monkeypatch.setattr(db_session, "commit", simulated_race_commit)

    response = client.post("/api/v1/newsletter/subscribe", json={"email": email})

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "already subscribed" in data["message"].lower()

    # Neither email function must be called on duplicate recovery
    mock_welcome.assert_not_called()
    mock_admin.assert_not_called()


def test_subscribe_newsletter_unrelated_integrity_error_reraised(db_session, monkeypatch):
    """
    Simulate an unrelated IntegrityError commit failure (e.g. NOT NULL violation).
    Verify rollback occurs and the original error is re-raised rather than masked
    as a successful subscription.
    """
    email = "unrelated_fail@example.com"
    mock_welcome = AsyncMock(return_value=EmailResult(success=True))
    mock_admin = AsyncMock(return_value=EmailResult(success=True))
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_welcome", mock_welcome)
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_admin_notification", mock_admin)

    original_rollback = db_session.rollback
    rollback_called = False

    def tracked_rollback():
        nonlocal rollback_called
        rollback_called = True
        return original_rollback()

    def fail_commit():
        orig_exc = sqlite3.IntegrityError("NOT NULL constraint failed: newsletter_subscribers.email")
        orig_exc.sqlite_errorname = "SQLITE_CONSTRAINT_NOTNULL"
        raise IntegrityError("INSERT INTO newsletter_subscribers", {}, orig_exc)

    monkeypatch.setattr(db_session, "rollback", tracked_rollback)
    monkeypatch.setattr(db_session, "commit", fail_commit)

    # 1. With default client (raise_server_exceptions=True), verify exception is re-raised
    with TestClient(app, raise_server_exceptions=True) as strict_client:
        with pytest.raises(IntegrityError):
            strict_client.post("/api/v1/newsletter/subscribe", json={"email": email})

    assert rollback_called is True

    # 2. With raise_server_exceptions=False, verify global handler returns HTTP 500
    with TestClient(app, raise_server_exceptions=False) as leniency_client:
        response = leniency_client.post("/api/v1/newsletter/subscribe", json={"email": email})
        assert response.status_code == 500
        assert "unexpected error" in response.json()["detail"].lower()

    # Neither email function must be called
    mock_welcome.assert_not_called()
    mock_admin.assert_not_called()


def test_subscribe_newsletter_reactivation_race(client, db_session, monkeypatch):
    """
    Simulate another concurrent request activating the subscriber before the
    conditional update executes. Verify zero affected rows, HTTP 200 already subscribed,
    and neither email function is called.
    """
    email = "reactivate_race@example.com"
    sub = NewsletterSubscriber(email=email, is_active=False)
    db_session.add(sub)
    db_session.commit()

    mock_welcome = AsyncMock(return_value=EmailResult(success=True))
    mock_admin = AsyncMock(return_value=EmailResult(success=True))
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_welcome", mock_welcome)
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_admin_notification", mock_admin)

    original_update = Query.update
    race_simulated = False

    def simulated_race_update(query_self, values, *args, **kwargs):
        nonlocal race_simulated
        if not race_simulated:
            race_simulated = True
            # Simulate that another request already activated the subscriber:
            # Set is_active = True in memory/session so refresh sees the active state,
            # and return 0 affected rows to represent the conditional update matching 0 rows.
            sub.is_active = True
            return 0
        return original_update(query_self, values, *args, **kwargs)

    monkeypatch.setattr(Query, "update", simulated_race_update)

    response = client.post("/api/v1/newsletter/subscribe", json={"email": email})

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "already subscribed" in data["message"].lower()

    # Neither email function must be called
    mock_welcome.assert_not_called()
    mock_admin.assert_not_called()


def test_subscribe_newsletter_reactivation_success(client, db_session, monkeypatch):
    """
    Verify successful reactivation when conditional update matches exactly 1 row.
    The subscriber becomes active, reactivation response is returned, and welcome
    and admin emails are dispatched exactly once.
    """
    email = "reactivate_success@example.com"
    sub = NewsletterSubscriber(email=email, is_active=False)
    db_session.add(sub)
    db_session.commit()

    mock_welcome = AsyncMock(return_value=EmailResult(success=True))
    mock_admin = AsyncMock(return_value=EmailResult(success=True))
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_welcome", mock_welcome)
    monkeypatch.setattr("app.routes.newsletter.send_newsletter_admin_notification", mock_admin)

    response = client.post("/api/v1/newsletter/subscribe", json={"email": email})

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == email
    assert "welcome back" in data["message"].lower()
    assert "reactivated" in data["message"].lower()

    # Subscriber must now be active in the database
    db_session.refresh(sub)
    assert sub.is_active is True

    # Both email functions must be called exactly once
    mock_welcome.assert_called_once_with(email)
    mock_admin.assert_called_once_with(email)
