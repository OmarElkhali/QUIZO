import json
import os

import requests
from dotenv import load_dotenv

load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise SystemExit("GEMINI_API_KEY non configuree")

url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"

payload = {
    "contents": [{
        "parts": [{
            "text": 'Genere une question de quiz en francais au format JSON: {"question": "texte", "reponse": "texte"}'
        }]
    }]
}

print("Test de l'API Gemini...")

try:
    response = requests.post(
        url,
        params={"key": GEMINI_API_KEY},
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=30,
    )

    print(f"Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Reponse: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}")
    else:
        print(f"Erreur: {response.text[:500]}")
except Exception as e:
    print(f"Exception: {e}")
