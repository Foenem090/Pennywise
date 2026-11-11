def test_get_coins_default(client):
    response = client.get("/api/v1/coins")
    assert response.status_code == 200
    data = response.json()
    assert "coins" in data
    assert data["count"] <= 6
    assert len(data["coins"]) <= 6
    if len(data["coins"]) > 0:
        first_coin = data["coins"][0]
        assert "name" in first_coin
        assert "symbol" in first_coin
        assert "current_price" in first_coin


def test_get_coins_custom_limit(client):
    response = client.get("/api/v1/coins?limit=3")
    assert response.status_code == 200
    data = response.json()
    assert data["count"] <= 3


def test_search_coins(client):
    response = client.get("/api/v1/coins/search?q=btc")
    assert response.status_code == 200
    data = response.json()
    assert "coins" in data
    symbols = [coin["symbol"].lower() for coin in data["coins"]]
    assert "btc" in symbols
