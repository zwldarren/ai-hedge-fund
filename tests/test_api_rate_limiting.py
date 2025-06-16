import os
import pytest
from unittest.mock import Mock, patch, call
import requests

from src.tools.api import _make_api_request, get_prices


class TestRateLimiting:
    """Test suite for API rate limiting functionality."""

    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.get')
    def test_make_api_request_handles_single_429_then_success(self, mock_get, mock_sleep):
        """Test that _make_api_request retries once after a 429 and succeeds."""
        # Setup mock responses: first 429, then 200
        mock_429_response = Mock()
        mock_429_response.status_code = 429
        
        mock_200_response = Mock()
        mock_200_response.status_code = 200
        mock_200_response.text = "Success"
        
        mock_get.side_effect = [mock_429_response, mock_200_response]
        
        # Call the function
        headers = {"X-API-KEY": "test-key"}
        url = "https://api.financialdatasets.ai/test"
        
        result = _make_api_request(url, headers)
        
        # Verify behavior
        assert result.status_code == 200
        assert result.text == "Success"
        
        # Verify requests.get was called twice
        assert mock_get.call_count == 2
        mock_get.assert_has_calls([
            call(url, headers=headers),
            call(url, headers=headers)
        ])
        
        # Verify sleep was called once with 60 seconds
        mock_sleep.assert_called_once_with(60)

    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.get')
    def test_make_api_request_handles_multiple_429s_then_success(self, mock_get, mock_sleep):
        """Test that _make_api_request retries multiple times after 429s."""
        # Setup mock responses: three 429s, then 200
        mock_429_response = Mock()
        mock_429_response.status_code = 429
        
        mock_200_response = Mock()
        mock_200_response.status_code = 200
        mock_200_response.text = "Success"
        
        mock_get.side_effect = [
            mock_429_response, 
            mock_429_response, 
            mock_429_response, 
            mock_200_response
        ]
        
        # Call the function
        headers = {"X-API-KEY": "test-key"}
        url = "https://api.financialdatasets.ai/test"
        
        result = _make_api_request(url, headers)
        
        # Verify behavior
        assert result.status_code == 200
        assert result.text == "Success"
        
        # Verify requests.get was called 4 times
        assert mock_get.call_count == 4
        
        # Verify sleep was called 3 times with 60 seconds each
        assert mock_sleep.call_count == 3
        expected_calls = [call(60), call(60), call(60)]
        mock_sleep.assert_has_calls(expected_calls)

    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.post')
    def test_make_api_request_post_method_with_429_then_success(self, mock_post, mock_sleep):
        """Test that _make_api_request handles POST requests with rate limiting."""
        # Setup mock responses: first 429, then 200
        mock_429_response = Mock()
        mock_429_response.status_code = 429
        
        mock_200_response = Mock()
        mock_200_response.status_code = 200
        mock_200_response.text = "Success"
        
        mock_post.side_effect = [mock_429_response, mock_200_response]
        
        # Call the function with POST method
        headers = {"X-API-KEY": "test-key"}
        url = "https://api.financialdatasets.ai/test"
        json_data = {"test": "data"}
        
        result = _make_api_request(url, headers, method="POST", json_data=json_data)
        
        # Verify behavior
        assert result.status_code == 200
        assert result.text == "Success"
        
        # Verify requests.post was called twice
        assert mock_post.call_count == 2
        mock_post.assert_has_calls([
            call(url, headers=headers, json=json_data),
            call(url, headers=headers, json=json_data)
        ])
        
        # Verify sleep was called once
        mock_sleep.assert_called_once_with(60)

    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.get')
    def test_make_api_request_returns_non_429_errors_immediately(self, mock_get, mock_sleep):
        """Test that non-429 errors are returned without retrying."""
        # Setup mock response: 500 error
        mock_500_response = Mock()
        mock_500_response.status_code = 500
        mock_500_response.text = "Internal Server Error"
        
        mock_get.return_value = mock_500_response
        
        # Call the function
        headers = {"X-API-KEY": "test-key"}
        url = "https://api.financialdatasets.ai/test"
        
        result = _make_api_request(url, headers)
        
        # Verify behavior
        assert result.status_code == 500
        assert result.text == "Internal Server Error"
        
        # Verify requests.get was called only once
        assert mock_get.call_count == 1
        
        # Verify sleep was never called
        mock_sleep.assert_not_called()

    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.get')
    def test_make_api_request_returns_success_immediately(self, mock_get, mock_sleep):
        """Test that successful requests return immediately without retry."""
        # Setup mock response: 200 success
        mock_200_response = Mock()
        mock_200_response.status_code = 200
        mock_200_response.text = "Success"
        
        mock_get.return_value = mock_200_response
        
        # Call the function
        headers = {"X-API-KEY": "test-key"}
        url = "https://api.financialdatasets.ai/test"
        
        result = _make_api_request(url, headers)
        
        # Verify behavior
        assert result.status_code == 200
        assert result.text == "Success"
        
        # Verify requests.get was called only once
        assert mock_get.call_count == 1
        
        # Verify sleep was never called
        mock_sleep.assert_not_called()

    @patch('src.tools.api._cache')
    @patch('src.tools.api.time.sleep')
    @patch('src.tools.api.requests.get')
    def test_get_prices_with_rate_limiting(self, mock_get, mock_sleep, mock_cache):
        """Test that get_prices function properly handles rate limiting."""
        # Mock cache to return None (cache miss)
        mock_cache.get_prices.return_value = None
        
        # Setup mock responses: first 429, then 200 with valid data
        mock_429_response = Mock()
        mock_429_response.status_code = 429
        
        mock_200_response = Mock()
        mock_200_response.status_code = 200
        mock_200_response.json.return_value = {
            "ticker": "AAPL",
            "prices": [
                {
                    "time": "2024-01-01T00:00:00Z",
                    "open": 100.0,
                    "close": 101.0,
                    "high": 102.0,
                    "low": 99.0,
                    "volume": 1000
                }
            ]
        }
        
        mock_get.side_effect = [mock_429_response, mock_200_response]
        
        # Set environment variable for API key
        with patch.dict(os.environ, {"FINANCIAL_DATASETS_API_KEY": "test-key"}):
            # Call get_prices
            result = get_prices("AAPL", "2024-01-01", "2024-01-02")
        
        # Verify the function succeeded and returned data
        assert len(result) == 1
        assert result[0].open == 100.0
        assert result[0].close == 101.0
        
        # Verify rate limiting behavior
        assert mock_get.call_count == 2
        mock_sleep.assert_called_once_with(60)
        
        # Verify cache operations
        mock_cache.get_prices.assert_called_once()
        mock_cache.set_prices.assert_called_once()


if __name__ == "__main__":
    pytest.main([__file__]) 