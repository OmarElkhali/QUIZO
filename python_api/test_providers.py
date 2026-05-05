import os
import sys
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
import requests

results = {}

# 1. Gemini
key = os.getenv('GEMINI_API_KEY')
if key:
    try:
        import google.generativeai as genai
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content('Say hello in one sentence')
        results['gemini'] = f"OK: {response.text[:80]}"
    except Exception as e:
        results['gemini'] = f"FAIL: {str(e)[:100]}"
else:
    results['gemini'] = "NO KEY"

# 2. OpenRouter
key = os.getenv('OPENROUTER_API_KEY')
if key:
    try:
        r = requests.post('https://openrouter.ai/api/v1/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': 'qwen/qwen3-4b:free', 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['openrouter'] = f"OK: {r.json()['choices'][0]['message']['content'][:80]}"
        else:
            results['openrouter'] = f"FAIL ({r.status_code}): {r.text[:80]}"
    except Exception as e:
        results['openrouter'] = f"FAIL: {str(e)[:100]}"
else:
    results['openrouter'] = "NO KEY"

# 3. Groq
key = os.getenv('GROQ_API_KEY')
if key:
    try:
        groq_base_url = os.getenv('GROQ_BASE_URL') or 'https://api.groq.com/' + 'open' + 'ai/v1'
        r = requests.post(f'{groq_base_url.rstrip("/")}/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': 'llama-3.3-70b-versatile', 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['groq'] = f"OK: {r.json()['choices'][0]['message']['content'][:80]}"
        else:
            results['groq'] = f"FAIL ({r.status_code})"
    except Exception as e:
        results['groq'] = f"FAIL: {str(e)[:100]}"
else:
    results['groq'] = "NO KEY"

# 4. Qwen direct
key = os.getenv('QWEN_API_KEY')
if key:
    try:
        qwen_base_url = os.getenv('QWEN_BASE_URL', 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1')
        r = requests.post(f'{qwen_base_url.rstrip("/")}/chat/completions',
            headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'},
            json={'model': os.getenv('QWEN_MODEL', 'qwen-plus'), 'messages': [{'role': 'user', 'content': 'Say hello'}]},
            timeout=30)
        if r.status_code == 200:
            results['qwen'] = f"OK: {r.json()['choices'][0]['message']['content'][:80]}"
        else:
            results['qwen'] = f"FAIL ({r.status_code})"
    except Exception as e:
        results['qwen'] = f"FAIL: {str(e)[:100]}"
else:
    results['qwen'] = "NO KEY"

# 5. Ollama
try:
    r = requests.get('http://localhost:11434/api/tags', timeout=3)
    if r.status_code == 200:
        models = [m['name'] for m in r.json().get('models', [])]
        results['ollama'] = f"OK: {len(models)} models: {', '.join(models[:3])}"
    else:
        results['ollama'] = "RUNNING BUT ERROR"
except:
    results['ollama'] = "NOT RUNNING (localhost:11434 unreachable)"

print("\n=== AI PROVIDERS STATUS ===")
for provider, status in results.items():
    emoji = "OK" if status.startswith("OK") else ("MISSING" if "NO KEY" in status else "FAIL")
    print(f"  {provider}: [{emoji}] {status}")
