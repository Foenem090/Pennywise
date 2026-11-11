def test_get_rates(client):
    response = client.get("/api/v1/calculator/rates")
    assert response.status_code == 200
    data = response.json()
    assert "rates" in data
    assert "USDC" in data["rates"]
    assert data["rates"]["USDC"] == 12.0


def test_estimate_returns_calculation(client):
    response = client.post(
        "/api/v1/calculator/estimate",
        json={"asset": "USDC", "amount": 10000.0}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["asset"] == "USDC"
    assert data["amount"] == 10000.0
    assert data["apy_percentage"] == 12.0
    # 10,000 * 0.12 = 1200 yearly
    assert data["estimated_yearly_return"] == 1200.0
    # 1200 / 12 = 100 monthly
    assert data["estimated_monthly_return"] == 100.0
    assert "not guaranteed" in data["disclaimer"]


def test_estimate_invalid_amount(client):
    response = client.post(
        "/api/v1/calculator/estimate",
        json={"asset": "BTC", "amount": -50.0}
    )
    assert response.status_code == 422

