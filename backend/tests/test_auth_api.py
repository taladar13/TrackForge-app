"""Integration tests for auth API endpoints."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
class TestAuthRegister:
    """Test POST /api/v1/auth/register."""

    async def test_register_success(self, client: AsyncClient):
        """Test successful user registration."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "securepassword123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert "access_token" in data["tokens"]
        assert "refresh_token" in data["tokens"]

    async def test_register_duplicate_email(self, client: AsyncClient):
        """Test registration with duplicate email fails."""
        # First registration
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "securepassword123",
            },
        )
        
        # Second registration with same email
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "differentpassword",
            },
        )
        
        assert response.status_code == 409
        assert "already registered" in response.json()["message"].lower()

    async def test_register_invalid_email(self, client: AsyncClient):
        """Test registration with invalid email fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "not-an-email",
                "password": "securepassword123",
            },
        )
        
        assert response.status_code == 422

    async def test_register_short_password(self, client: AsyncClient):
        """Test registration with short password fails."""
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "user@example.com",
                "password": "short",
            },
        )
        
        assert response.status_code == 422


@pytest.mark.asyncio
class TestAuthLogin:
    """Test POST /api/v1/auth/login."""

    async def test_login_success(self, client: AsyncClient):
        """Test successful login."""
        # Register first
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "loginuser@example.com",
                "password": "securepassword123",
            },
        )
        
        # Login
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "loginuser@example.com",
                "password": "securepassword123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data

    async def test_login_wrong_password(self, client: AsyncClient):
        """Test login with wrong password fails."""
        # Register first
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "securepassword123",
            },
        )
        
        # Login with wrong password
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrongpass@example.com",
                "password": "wrongpassword",
            },
        )
        
        assert response.status_code == 401

    async def test_login_nonexistent_user(self, client: AsyncClient):
        """Test login with nonexistent user fails."""
        response = await client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "anypassword",
            },
        )
        
        assert response.status_code == 401


@pytest.mark.asyncio
class TestAuthRefresh:
    """Test POST /api/v1/auth/refresh."""

    async def test_refresh_success(self, client: AsyncClient):
        """Test successful token refresh."""
        # Register to get tokens
        register_response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "refreshuser@example.com",
                "password": "securepassword123",
            },
        )
        refresh_token = register_response.json()["tokens"]["refresh_token"]
        
        # Refresh
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        # New tokens should be different
        assert data["refresh_token"] != refresh_token

    async def test_refresh_invalid_token(self, client: AsyncClient):
        """Test refresh with invalid token fails."""
        response = await client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token"},
        )
        
        assert response.status_code == 401


