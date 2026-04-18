"""Unit tests for encryption service."""

from unittest.mock import patch, MagicMock

import pytest
from cryptography.fernet import Fernet

# Reset module-level singleton before each import
import app.services.encryption as enc_mod


@pytest.fixture(autouse=True)
def reset_fernet():
    """Reset the module-level _fernet singleton between tests."""
    enc_mod._fernet = None
    yield
    enc_mod._fernet = None


@pytest.fixture()
def fernet_key():
    """Generate a valid Fernet key for tests."""
    return Fernet.generate_key().decode()


@pytest.fixture()
def mock_settings(fernet_key):
    """Patch get_settings to return a mock with a valid encryption_key."""
    mock = MagicMock()
    mock.encryption_key = fernet_key
    with patch.object(enc_mod, "get_settings", return_value=mock):
        yield mock


class TestEncrypt:
    def test_encrypt_returns_string(self, mock_settings):
        result = enc_mod.encrypt("hello-world")
        assert isinstance(result, str)
        assert result != "hello-world"

    def test_encrypt_decrypt_roundtrip(self, mock_settings):
        plaintext = "HDFC00012345"
        ciphertext = enc_mod.encrypt(plaintext)
        decrypted = enc_mod.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_different_outputs(self, mock_settings):
        """Fernet produces different ciphertexts for same input (due to IV)."""
        a = enc_mod.encrypt("same")
        b = enc_mod.encrypt("same")
        assert a != b


class TestDecrypt:
    def test_decrypt_invalid_token_returns_mask(self, mock_settings):
        result = enc_mod.decrypt("not-a-valid-ciphertext")
        assert result == "••••••••"

    def test_decrypt_wrong_key_returns_mask(self, fernet_key):
        """Encrypt with one key, decrypt with another → mask."""
        mock1 = MagicMock()
        mock1.encryption_key = fernet_key
        with patch.object(enc_mod, "get_settings", return_value=mock1):
            ciphertext = enc_mod.encrypt("secret")

        # Reset and use a different key
        enc_mod._fernet = None
        mock2 = MagicMock()
        mock2.encryption_key = Fernet.generate_key().decode()
        with patch.object(enc_mod, "get_settings", return_value=mock2):
            result = enc_mod.decrypt(ciphertext)
        assert result == "••••••••"


class TestMaskAccountNumber:
    def test_mask_long_number(self):
        assert enc_mod.mask_account_number("12345678901234") == "••••••••1234"

    def test_mask_exact_4(self):
        assert enc_mod.mask_account_number("1234") == "1234"

    def test_mask_short_number(self):
        assert enc_mod.mask_account_number("12") == "12"

    def test_mask_5_digits(self):
        assert enc_mod.mask_account_number("12345") == "••••••••2345"


class TestGetFernetNoKey:
    def test_raises_without_encryption_key(self):
        mock = MagicMock()
        mock.encryption_key = ""
        with patch.object(enc_mod, "get_settings", return_value=mock):
            with pytest.raises(RuntimeError, match="ENCRYPTION_KEY"):
                enc_mod._get_fernet()
