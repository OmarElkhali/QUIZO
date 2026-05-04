# -*- coding: utf-8 -*-
"""Smoke-test QUIZO AI providers without printing secrets.

Run from the repository root:
    python_api/.venv/Scripts/python.exe python_api/test_ai_providers.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from app import app  # noqa: E402


COURSE_TEXT = """
Cours: La photosynthese.
La photosynthese transforme le dioxyde de carbone et l'eau en glucose grace a
l'energie lumineuse captee par la chlorophylle. La phase lumineuse se deroule
dans les thylakoides et produit de l'ATP et du NADPH. Le cycle de Calvin se
deroule dans le stroma du chloroplaste et utilise l'ATP et le NADPH pour fixer
le carbone. Les stomates controlent les echanges gazeux: ils permettent
l'entree du CO2 et limitent la perte d'eau. La photosynthese libere aussi du
dioxygene.
"""

GROUNDING_TERMS = {
    "photosynthese",
    "chlorophylle",
    "thylakoide",
    "calvin",
    "stroma",
    "stomate",
    "glucose",
    "co2",
    "nadph",
    "atp",
}


def normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower())


def score_grounding(questions: list[dict]) -> dict:
    text = normalize(json.dumps(questions, ensure_ascii=False))
    matched = sorted(term for term in GROUNDING_TERMS if term in text)
    valid_shape = all(
        isinstance(q.get("text"), str)
        and isinstance(q.get("options"), list)
        and len(q["options"]) == 4
        and sum(1 for option in q["options"] if option.get("isCorrect") is True) == 1
        for q in questions
    )
    return {
        "valid_shape": valid_shape,
        "grounded_terms": matched,
        "grounded": len(matched) >= 3,
    }


def test_provider(client, provider: str) -> dict:
    response = client.post(
        "/api/generate",
        json={
            "text": COURSE_TEXT,
            "numQuestions": 3,
            "difficulty": "medium",
            "modelType": provider,
        },
    )
    payload = response.get_json(silent=True) or {}
    questions = payload.get("questions") or []
    grounding = score_grounding(questions) if isinstance(questions, list) else {
        "valid_shape": False,
        "grounded_terms": [],
        "grounded": False,
    }

    return {
        "provider": provider,
        "http_status": response.status_code,
        "fallback": bool(payload.get("fallback")),
        "model": payload.get("model"),
        "question_count": len(questions) if isinstance(questions, list) else 0,
        **grounding,
        "warning": payload.get("warning"),
        "error": payload.get("error"),
    }


def main() -> int:
    providers = ["gemini", "chatgpt", "openrouter", "qwen", "groq", "ollama"]
    with app.test_client() as client:
        health = client.get("/api/health").get_json(silent=True) or {}
        provider_state = client.get("/api/providers").get_json(silent=True) or {}
        print("HEALTH")
        print(json.dumps(health, ensure_ascii=False, indent=2))
        print("PROVIDERS")
        print(json.dumps(provider_state, ensure_ascii=False, indent=2))

        results = [test_provider(client, provider) for provider in providers]

    print("AI_PROVIDER_RESULTS")
    print(json.dumps(results, ensure_ascii=False, indent=2))

    failed_shape = [r["provider"] for r in results if r["http_status"] != 200 or not r["valid_shape"]]
    if failed_shape:
        print(f"FAILED_SHAPE={','.join(failed_shape)}")
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
