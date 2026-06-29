import { expect, test, type Page } from '@playwright/test';

const PASSWORD = process.env.E2E_USER_PASSWORD || 'QuizoTest123!';
const LIVE_MODE = process.env.E2E_LIVE_AI === 'true';

const uniqueEmail = (label: string) =>
  `quizo.e2e.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

async function signUpTestUser(page: Page, label: string) {
  const email = process.env.E2E_USER_EMAIL || uniqueEmail(label);

  await page.goto('/');
  await expect(page.locator('body')).toContainText(/QUIZO/i);

  await page.getByRole('button', { name: /Connexion|Login|Se connecter/i }).click();
  await page.getByRole('tab', { name: /Inscription|Sign up/i }).click();
  await page.locator('#signup-name').fill(`QUIZO E2E ${label}`);
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(PASSWORD);
  await page.getByRole('button', { name: /Créer un compte|Create account/i }).click();

  await expect(page.getByRole('link', { name: /Créer un Quiz IA|Create AI Quiz/i }).first()).toBeVisible({ timeout: 30_000 });
  return { email, password: PASSWORD };
}

test.describe('QUIZO AI Providers quiz generation', () => {
  // Configurer le mocking avant chaque test si on n'est pas en mode live
  test.beforeEach(async ({ page }) => {
    if (!LIVE_MODE) {
      console.log('E2E: Mode Mock actif pour les appels d\'API IA.');
      
      // Mock de l'extraction de texte
      await page.route('**/api/extract-text', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            text: "QUIZO est une superbe plateforme éducative.",
            filename: "quizo-e2e-source.txt",
            characters: 42
          })
        });
      });

      // Mock de la génération de questions par IA
      await page.route('**/api/generate', async (route) => {
        const postData = JSON.parse(route.request().postData() || '{}');
        const modelType = postData.modelType || 'unknown';
        const numQuestions = postData.numQuestions || 5;
        
        console.log(`Mocking generation for model: ${modelType}`);
        
        const mockQuestions = [];
        for (let i = 0; i < numQuestions; i++) {
          mockQuestions.push({
            id: `gen_q${i + 1}`,
            text: `Question ${i + 1} sur QUIZO (générée via ${modelType})`,
            options: [
              { id: `q${i + 1}_a`, text: `Option correcte de ${modelType}`, isCorrect: true },
              { id: `q${i + 1}_b`, text: `Option fausse A`, isCorrect: false },
              { id: `q${i + 1}_c`, text: `Option fausse B`, isCorrect: false },
              { id: `q${i + 1}_d`, text: `Option fausse C`, isCorrect: false }
            ],
            explanation: `Explication de la réponse de ${modelType}`,
            difficulty: postData.difficulty || 'medium'
          });
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            questions: mockQuestions,
            provider: modelType,
            fallback_used: false
          })
        });
      });
    } else {
      console.log('E2E: Mode Live actif. Connexion directe aux serveurs de production/locaux.');
    }
  });

  const providers = [
    { name: 'Gemini', id: 'gemini' },
    { name: 'Groq', id: 'groq' },
    { name: 'OpenRouter', id: 'openrouter' }
  ];

  for (const provider of providers) {
    test(`Génération de quiz fonctionnelle avec le modèle ${provider.name}`, async ({ page }) => {
      await signUpTestUser(page, `ai-${provider.id}`);

      await page.goto('/create-quiz');
      await expect(page.getByRole('heading', { name: /Créer un nouveau quiz|Create a new quiz/i })).toBeVisible();

      // Uploader un fichier source
      await page.locator('input[type="file"]').setInputFiles({
        name: 'quizo-e2e-source.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(
          'QUIZO utilise Firebase pour les données realtime, Supabase pour le stockage, Vercel pour le frontend et Flask sur Render.'
        ),
      });

      // S'assurer que le fichier est bien chargé
      await expect(page.getByText('quizo-e2e-source.txt')).toBeVisible({ timeout: 10_000 });

      // Sélectionner le modèle d'IA
      await page.getByRole('button', { name: provider.name }).click();

      // Réduire le nombre de questions à 5 pour accélérer la génération
      await page.getByRole('slider').press('ArrowLeft');

      // Soumettre le formulaire
      await page.locator('form button[type="submit"]').click();

      // Attendre la redirection vers le quiz généré (timeout plus grand pour le mode live)
      await page.waitForURL(/\/quiz-preview\/.+/, { timeout: LIVE_MODE ? 240_000 : 30_000 });

      // Valider que le quiz et les questions s'affichent correctement
      await expect(page.locator('body')).toContainText(/Quiz|question/i);
    });
  }
});
