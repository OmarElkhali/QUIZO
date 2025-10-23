#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de test pour valider l'API de génération de quiz avec Gemini
"""
import requests
import json
import time

# Attendre que le serveur démarre
print("Attendez que le serveur Flask démarre...")
time.sleep(2)

# Test 1: Health Check
print("\n=== Test 1: Health Check ===")
try:
    response = requests.get("http://localhost:5000/api/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
except Exception as e:
    print(f"Erreur: {e}")

# Test 2: Génération de quiz avec un texte simple
print("\n=== Test 2: Génération de Quiz avec Gemini ===")
try:
    test_text = """
    Python est un langage de programmation de haut niveau, interprété et orienté objet.
    Il a été créé par Guido van Rossum et publié pour la première fois en 1991.
    Python est connu pour sa syntaxe claire et lisible, ce qui en fait un excellent choix pour les débutants.
    Le langage supporte plusieurs paradigmes de programmation, notamment la programmation procédurale, 
    orientée objet et fonctionnelle.
    """
    
    payload = {
        "text": test_text,
        "numQuestions": 3,
        "difficulty": "medium",
        "modelType": "gemini"
    }
    
    print(f"Envoi de la requête avec {len(test_text)} caractères de texte...")
    response = requests.post(
        "http://localhost:5000/api/generate",
        json=payload,
        timeout=60
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\n✅ Génération réussie!")
        print(f"Nombre de questions générées: {len(data['questions'])}")
        
        # Afficher la première question
        if data['questions']:
            q = data['questions'][0]
            print(f"\nPremière question:")
            print(f"  Texte: {q['text']}")
            print(f"  Difficulté: {q['difficulty']}")
            print(f"  Options: {len(q['options'])}")
            correct = [opt['text'] for opt in q['options'] if opt['isCorrect']]
            print(f"  Réponse correcte: {correct[0] if correct else 'N/A'}")
            print(f"  Explication: {q['explanation'][:100]}...")
    else:
        print(f"❌ Erreur: {response.text}")
        
except Exception as e:
    print(f"❌ Erreur lors du test: {e}")

print("\n=== Tests terminés ===")
