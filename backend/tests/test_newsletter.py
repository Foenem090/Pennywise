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
