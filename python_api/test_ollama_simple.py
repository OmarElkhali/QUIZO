import requests
import json

print("Test simple Ollama...")
print("Modèle: qwen3-vl:4b")
print("Génération d''une phrase courte...")

response = requests.post(
    "http://localhost:11434/api/generate",
    json={
        "model": "qwen3-vl:4b",
        "prompt": "Dis bonjour en français.",
        "stream": False
    },
    timeout=300
)

result = response.json()
print("Réponse:", result.get("response", ""))
print(" Test réussi!")
