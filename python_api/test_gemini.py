import requests
import json
import os # <-- 1. Importer os

# 2. Lire la clé depuis les variables d'environnement (plus sécurisé)
GEMINI_API_KEY = os.environ.get("AIzaSyB-XpyVgRljUIcR7cBECGKqb7-3_RVgT5M")


# Test de l'API Gemini avec gemini-pro sur v1
url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}'

payload = {
    "contents": [{
        "parts": [{
            "text": "Génère une question de quiz en français au format JSON avec cette structure: {\"question\": \"texte\", \"reponse\": \"texte\"}"
        }]
    }]
}

print(f"Test de l'API Gemini...")
print(f"URL: {url[:80]}...")

try:
    response = requests.post(
        url,
        headers={'Content-Type': 'application/json'},
        json=payload,
        timeout=30
    )
    
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        print("✅ Succès!")
        data = response.json()
        print(f"Réponse: {json.dumps(data, indent=2)[:500]}")
    else:
        print("❌ Erreur")
        print(f"Détails: {response.text[:500]}")
        
except Exception as e:
    print(f"❌ Exception: {e}")
