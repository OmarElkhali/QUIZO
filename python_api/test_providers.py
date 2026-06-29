import os
import sys
import requests
from dotenv import load_dotenv

# Charger les variables d'environnement du fichier .env
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

results = {}

# 1. Gemini
key = os.getenv('GEMINI_API_KEY')
if key and key != "your_gemini_api_key_here":
    try:
        # Suppress warnings from google-generativeai deprecation
        import warnings
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            import google.generativeai as genai
        
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content('Say hello in one sentence')
        results['gemini'] = f"OK: {response.text.strip()[:80]}"
    except Exception as e:
        results['gemini'] = f"FAIL: {str(e)[:100]}"
else:
    results['gemini'] = "NO KEY (Modifiez GEMINI_API_KEY dans python_api/.env)"

# 2. OpenRouter
key = os.getenv('OPENROUTER_API_KEY')
if key and key != "your_openrouter_api_key_here":
    try:
        model_name = os.getenv('OPENROUTER_MODEL', 'qwen/qwen-2.5-72b-instruct')
        r = requests.post('https://openrouter.ai/api/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173',
                'X-Title': 'QUIZO'
            },
            json={'model': model_name, 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['openrouter'] = f"OK: {r.json()['choices'][0]['message']['content'].strip()[:80]}"
        else:
            results['openrouter'] = f"FAIL ({r.status_code}): {r.text[:120]}"
    except Exception as e:
        results['openrouter'] = f"FAIL: {str(e)[:100]}"
else:
    results['openrouter'] = "NO KEY (Modifiez OPENROUTER_API_KEY dans python_api/.env)"

# 3. Groq
key = os.getenv('GROQ_API_KEY')
if key and key != "your_groq_api_key_here":
    try:
        groq_base_url = os.getenv('GROQ_BASE_URL') or 'https://api.groq.com/openai/v1'
        groq_model = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
        r = requests.post(f'{groq_base_url.rstrip("/")}/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': groq_model, 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['groq'] = f"OK: {r.json()['choices'][0]['message']['content'].strip()[:80]}"
        else:
            results['groq'] = f"FAIL ({r.status_code}): {r.text[:120]}"
    except Exception as e:
        results['groq'] = f"FAIL: {str(e)[:100]}"
else:
    results['groq'] = "NO KEY (Modifiez GROQ_API_KEY dans python_api/.env)"

# 4. Qwen direct
key = os.getenv('QWEN_API_KEY')
if key and key != "your_qwen_dashscope_api_key_here":
    try:
        qwen_base_url = os.getenv('QWEN_BASE_URL', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
        r = requests.post(f'{qwen_base_url.rstrip("/")}/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': os.getenv('QWEN_MODEL', 'qwen-plus'), 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['qwen'] = f"OK: {r.json()['choices'][0]['message']['content'].strip()[:80]}"
        else:
            results['qwen'] = f"FAIL ({r.status_code}): {r.text[:120]}"
    except Exception as e:
        results['qwen'] = f"FAIL: {str(e)[:100]}"
else:
    # Si pas de clé Qwen directe mais qu'on a OpenRouter, Qwen passe par OpenRouter dans l'app
    or_key = os.getenv('OPENROUTER_API_KEY')
    if or_key and or_key != "your_openrouter_api_key_here":
        results['qwen'] = "OK (Via OpenRouter configuré)"
    else:
        results['qwen'] = "NO KEY (Modifiez QWEN_API_KEY dans python_api/.env)"


print("\n=== DIAGNOSTIC DES PROVIDERS IA ===")
for provider, status in results.items():
    if status.startswith("OK"):
        emoji = "✅ OK"
    elif "NO KEY" in status:
        emoji = "⚠️  MISSING"
    else:
        emoji = "❌ FAIL"
    print(f"  {provider.upper():<12} : [{emoji}] {status}")

print("\n=== NOTE ===")
print("Pour exécuter la génération en mode réel, assurez-vous de configurer vos clés API dans python_api/.env.")
print("Par défaut, les tests Playwright s'exécutent en mode mocké pour éviter d'échouer sur des clés manquantes.")
