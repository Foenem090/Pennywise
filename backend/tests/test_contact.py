def test_submit_contact_inquiry_success(client):
    response = client.post(
        "/api/v1/contact",
        json={
            "name": "Sarah Connor",
            "email": "sarah@cyberdyne.com",
            "message": "I would like more information on rolling over my 401(k) to a crypto IRA."
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Sarah Connor"
    assert data["email"] == "sarah@cyberdyne.com"
    assert "Thank you" in data["message"]


def test_submit_contact_inquiry_invalid(client):
    # Missing message and invalid email
    response = client.post(
        "/api/v1/contact",
        json={
            "name": "A",
            "email": "invalid-email",
            "message": "short"
        }
    )
    assert response.status_code == 422
