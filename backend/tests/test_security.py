"""Unit tests for security utilities."""

import pytest
from datetime import timedelta

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_token_subject,
)
from app.core.errors import UnauthorizedError


class TestPasswordHashing:
    """Test password hashing functions."""

    def test_hash_password(self):
        """Test password is hashed."""
        password = "secure_password_123"
        hashed = hash_password(password)
        
        assert hashed != password
        assert len(hashed) > 0

    def test_verify_password_correct(self):
        """Test correct password verification."""
        password = "secure_password_123"
        hashed = hash_password(password)
        
        assert verify_password(password, hashed) is True

    def test_verify_password_incorrect(self):
        """Test incorrect password verification."""
        password = "secure_password_123"
        hashed = hash_password(password)
        
        assert verify_password("wrong_password", hashed) is False

    def test_different_hashes_same_password(self):
        """Test same password produces different hashes (salting)."""
        password = "secure_password_123"
        hash1 = hash_password(password)
        hash2 = hash_password(password)
        
        assert hash1 != hash2  # Different salts
        assert verify_password(password, hash1)
        assert verify_password(password, hash2)


class TestJWTTokens:
    """Test JWT token functions."""

    def test_create_access_token(self):
        """Test access token creation."""
        user_id = "test-user-id"
        token, jti, expires = create_access_token(user_id)
        
        assert token is not None
        assert jti is not None
        assert expires is not None

    def test_access_token_contains_subject(self):
        """Test access token contains correct subject."""
        user_id = "test-user-id"
        token, _, _ = create_access_token(user_id)
        
        subject = get_token_subject(token)
        assert subject == user_id

    def test_decode_access_token(self):
        """Test access token decoding."""
        user_id = "test-user-id"
        token, jti, _ = create_access_token(user_id)
        
        payload = decode_token(token)
        
        assert payload["sub"] == user_id
        assert payload["jti"] == jti
        assert payload["type"] == "access"

    def test_create_refresh_token(self):
        """Test refresh token creation."""
        user_id = "test-user-id"
        token, jti, family_id, expires = create_refresh_token(user_id)
        
        assert token is not None
        assert jti is not None
        assert family_id is not None
        assert expires is not None

    def test_decode_refresh_token(self):
        """Test refresh token decoding."""
        user_id = "test-user-id"
        token, jti, family_id, _ = create_refresh_token(user_id)
        
        payload = decode_token(token)
        
        assert payload["sub"] == user_id
        assert payload["jti"] == jti
        assert payload["family"] == family_id
        assert payload["type"] == "refresh"

    def test_refresh_token_same_family(self):
        """Test refresh token with same family ID."""
        user_id = "test-user-id"
        family = "existing-family-id"
        
        token, _, returned_family, _ = create_refresh_token(user_id, family_id=family)
        payload = decode_token(token)
        
        assert returned_family == family
        assert payload["family"] == family

    def test_invalid_token_raises_error(self):
        """Test invalid token raises UnauthorizedError."""
        with pytest.raises(UnauthorizedError):
            decode_token("invalid-token")

    def test_custom_expiry(self):
        """Test token with custom expiry."""
        user_id = "test-user-id"
        custom_expiry = timedelta(hours=1)
        
        token, _, expires = create_access_token(user_id, expires_delta=custom_expiry)
        payload = decode_token(token)
        
        assert payload["sub"] == user_id


