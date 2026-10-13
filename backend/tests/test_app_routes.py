import unittest

from app import app


class AppRoutesTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_lulc_stats_compatibility_route(self):
        login_response = self.client.post(
            "/api/auth/login",
            json={"username": "admin", "password": "admin123"},
        )
        self.assertEqual(login_response.status_code, 200)

        token = login_response.get_json()["access_token"]
        response = self.client.get(
            "/api/lulc/stats",
            headers={"Authorization": f"Bearer {token}"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("data", response.get_json())


if __name__ == "__main__":
    unittest.main()
