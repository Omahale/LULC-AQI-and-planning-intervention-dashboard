import os
import unittest
from unittest.mock import patch

from services.aqi_service import get_current_aqi


class AqiServiceLiveFetchTests(unittest.TestCase):
    @patch("requests.get")
    def test_get_current_aqi_uses_live_api_when_configured(self, mock_get):
        os.environ["AQI_API_URL"] = "https://example.com/aqi"
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "aqi": 156,
            "pm25": 72,
            "pm10": 110,
            "no2": 41,
            "so2": 19,
            "co": 11,
            "status": "Moderate",
            "timestamp": "2026-10-08T12:00:00Z",
        }

        response = get_current_aqi()

        self.assertEqual(response["source"], "live_api")
        self.assertEqual(response["data"]["aqi"], 156)
        self.assertEqual(response["data"]["status"], "Moderate")

    def test_get_current_aqi_falls_back_when_live_api_missing(self):
        os.environ.pop("AQI_API_URL", None)
        response = get_current_aqi()

        self.assertIn(response["source"], {"station_csv", "placeholder"})
        self.assertIn("aqi", response["data"])


if __name__ == "__main__":
    unittest.main()
