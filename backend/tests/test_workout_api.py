"""Integration tests for workout API endpoints."""

import pytest
from httpx import AsyncClient
from uuid import uuid4

from app.core.security import create_access_token


async def get_auth_headers(client: AsyncClient) -> dict[str, str]:
    """Helper to get auth headers for a test user."""
    # Register user
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": f"testuser_{uuid4().hex[:8]}@example.com",
            "password": "securepassword123",
        },
    )
    access_token = response.json()["tokens"]["access_token"]
    return {"Authorization": f"Bearer {access_token}"}


@pytest.mark.asyncio
class TestWorkoutSessions:
    """Test workout session endpoints."""

    async def test_create_session(self, client: AsyncClient):
        """Test creating a workout session."""
        headers = await get_auth_headers(client)
        session_id = str(uuid4())
        
        response = await client.post(
            "/api/v1/workout-sessions",
            headers=headers,
            json={
                "id": session_id,
                "workout_name": "Push Day",
                "date": "2024-01-15",
                "sets": [],
            },
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["id"] == session_id
        assert data["workout_name"] == "Push Day"

    async def test_create_session_idempotent(self, client: AsyncClient):
        """Test creating same session twice returns same result."""
        headers = await get_auth_headers(client)
        session_id = str(uuid4())
        idempotency_key = str(uuid4())
        
        request_data = {
            "id": session_id,
            "workout_name": "Push Day",
            "date": "2024-01-15",
            "sets": [],
        }
        
        # First request
        response1 = await client.post(
            "/api/v1/workout-sessions",
            headers={**headers, "Idempotency-Key": idempotency_key},
            json=request_data,
        )
        
        # Second request with same idempotency key
        response2 = await client.post(
            "/api/v1/workout-sessions",
            headers={**headers, "Idempotency-Key": idempotency_key},
            json=request_data,
        )
        
        assert response1.status_code == 201
        assert response2.status_code == 201
        assert response1.json()["id"] == response2.json()["id"]

    async def test_create_session_with_sets(self, client: AsyncClient):
        """Test creating session with sets."""
        headers = await get_auth_headers(client)
        session_id = str(uuid4())
        set_id = str(uuid4())
        exercise_id = str(uuid4())  # Would need real exercise in prod
        
        response = await client.post(
            "/api/v1/workout-sessions",
            headers=headers,
            json={
                "id": session_id,
                "workout_name": "Leg Day",
                "date": "2024-01-15",
                "sets": [
                    {
                        "id": set_id,
                        "exercise_id": exercise_id,
                        "set_number": 1,
                        "weight": 100,
                        "reps": 10,
                        "completed": True,
                    },
                ],
            },
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["totals"]["total_sets"] == 1
        assert data["totals"]["total_volume"] == 1000

    async def test_get_session(self, client: AsyncClient):
        """Test getting a workout session."""
        headers = await get_auth_headers(client)
        session_id = str(uuid4())
        
        # Create session
        await client.post(
            "/api/v1/workout-sessions",
            headers=headers,
            json={
                "id": session_id,
                "workout_name": "Pull Day",
                "date": "2024-01-15",
                "sets": [],
            },
        )
        
        # Get session
        response = await client.get(
            f"/api/v1/workout-sessions/{session_id}",
            headers=headers,
        )
        
        assert response.status_code == 200
        assert response.json()["id"] == session_id

    async def test_list_sessions(self, client: AsyncClient):
        """Test listing workout sessions."""
        headers = await get_auth_headers(client)
        
        # Create a session
        await client.post(
            "/api/v1/workout-sessions",
            headers=headers,
            json={
                "id": str(uuid4()),
                "workout_name": "Test Workout",
                "date": "2024-01-15",
                "sets": [],
            },
        )
        
        # List sessions
        response = await client.get(
            "/api/v1/workout-sessions",
            headers=headers,
            params={"from": "2024-01-01", "to": "2024-01-31"},
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "data" in data
        assert "total" in data
        assert "page" in data
        assert len(data["data"]) >= 1

    async def test_unauthorized_access(self, client: AsyncClient):
        """Test accessing sessions without auth fails."""
        response = await client.get(
            "/api/v1/workout-sessions",
            params={"from": "2024-01-01", "to": "2024-01-31"},
        )
        
        assert response.status_code == 401


