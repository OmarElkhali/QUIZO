import os
import unittest
from unittest.mock import patch

os.environ["FIREBASE_PROJECT_ID"] = "ests-quiz"
os.environ["FLASK_ENV"] = "production"
os.environ["CORS_ORIGINS"] = "https://quizo-tau.vercel.app"

import app as backend


class ApiSecurityContractTest(unittest.TestCase):
    def setUp(self):
        self.client = backend.app.test_client()

    def test_public_capabilities_do_not_expose_secrets(self):
        response = self.client.get("/api/providers")
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(set(payload["providers"]), {"gemini", "groq", "openrouter"})
        self.assertNotIn("apiKey", response.get_data(as_text=True))

    def test_generation_requires_a_firebase_token(self):
        response = self.client.post("/api/generate", json={"text": "cours " * 30})
        self.assertEqual(response.status_code, 401)

    def test_answer_explanation_requires_a_firebase_token(self):
        response = self.client.post("/api/explain-answer", json={"question": "Question ?", "options": []})
        self.assertEqual(response.status_code, 401)

    def test_answer_explanation_uses_the_provider_waterfall(self):
        request_payload = {
            "question": "Quelle réponse est correcte ?",
            "selectedOptionId": "b",
            "options": [
                {"id": "a", "text": "La réponse correcte", "isCorrect": True},
                {"id": "b", "text": "Une réponse incorrecte", "isCorrect": False},
            ],
        }
        provider_payload = '{"explanation":"La première réponse respecte la règle.","keyPoint":"Retenir la règle."}'
        with patch.object(backend.firebase_auth, "verify_id_token", return_value={"uid": "test-user"}), \
             patch.object(backend, "generate_with_provider", return_value=provider_payload):
            response = self.client.post(
                "/api/explain-answer",
                headers={"Authorization": "Bearer test-token"},
                json=request_payload,
            )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["explanation"], "La première réponse respecte la règle.")

    def test_authenticated_payload_limits_run_before_provider_call(self):
        with patch.object(backend.firebase_auth, "verify_id_token", return_value={"uid": "test-user"}):
            response = self.client.post(
                "/api/generate",
                headers={"Authorization": "Bearer test-token"},
                json={"text": "x" * 50_001},
            )
        self.assertEqual(response.status_code, 413)

    def test_cors_is_limited_to_the_configured_frontend(self):
        allowed = self.client.get("/api/health", headers={"Origin": "https://quizo-tau.vercel.app"})
        denied = self.client.get("/api/health", headers={"Origin": "https://attacker.example"})
        self.assertEqual(allowed.headers.get("Access-Control-Allow-Origin"), "https://quizo-tau.vercel.app")
        self.assertIsNone(denied.headers.get("Access-Control-Allow-Origin"))


if __name__ == "__main__":
    unittest.main()
