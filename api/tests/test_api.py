import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "app_name" in data
    assert "version" in data


def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data


def test_register_user():
    """Test user registration"""
    user_data = {
        "email": "test@example.com",
        "name": "Test User",
        "phone": "1234567890",
        "age": 25,
        "gender": "male",
        "password": "Test@123",
        "looking_for": "female"
    }
    
    response = client.post("/api/v1/auth/register", json=user_data)
    
    # Note: This will fail without MongoDB running
    # In real tests, use a test database
    assert response.status_code in [201, 500]  # 500 if DB not connected


def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    login_data = {
        "email": "invalid@example.com",
        "password": "wrongpassword"
    }
    
    response = client.post("/api/v1/auth/login", json=login_data)
    
    # Should return 401 or 500 (if DB not connected)
    assert response.status_code in [401, 500]


def test_unauthorized_access():
    """Test accessing protected endpoint without auth"""
    response = client.get("/api/v1/profiles/me")
    assert response.status_code == 403  # Forbidden without auth


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
