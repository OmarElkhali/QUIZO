import { expect, test, type Browser, type Page } from '@playwright/test';

const PASSWORD = process.env.E2E_USER_PASSWORD || 'QuizoTest123!';
const LIVE_MODE = process.env.E2E_LIVE_AI === 'true';

const uniqueEmail = (label: string) =>
  `quizo.e2e.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

const localDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

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

async function addQuestion(page: Page, question: string, options: string[]) {
  await page.getByRole('button', { name: /Ajouter une question|Add question/i }).first().click();
  await page.locator('#question-text').fill(question);

  for (let index = 0; index < options.length; index += 1) {
    await page.getByPlaceholder(new RegExp(`Option ${index + 1}`)).fill(options[index]);
  }

  await page.getByRole('button', { name: /^Ajouter$/i }).click();
  await expect(page.getByText(question)).toBeVisible({ timeout: 20_000 });
}

async function answerCurrentQuestionWithFirstOption(page: Page) {
  await page.getByRole('radio').first().click({ force: true });
}

async function completeQuizSession(page: Page) {
  for (let safety = 0; safety < 20; safety += 1) {
    await answerCurrentQuestionWithFirstOption(page);

    const finishButton = page.getByRole('button', { name: /Terminer|Finish/i });
    if (await finishButton.isVisible().catch(() => false)) {
      await finishButton.click();
      return;
    }

    await page.getByRole('button', { name: /Suivant|Next/i }).click();
  }

  throw new Error('Unable to finish quiz session within the safety limit');
}

async function joinSharedQuiz(browser: Browser, baseURL: string, shareCode: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await signUpTestUser(page, 'participant');
  await page.goto(`${baseURL}/join-quiz/${shareCode}`);
  await page.locator('#name').fill('Participant E2E');
  await page.locator('#email').fill('participant.e2e@example.com');
  await page.getByRole('button', { name: /Rejoindre|Join/i }).click();
  await page.waitForURL(/\/quiz-session\/.+\/.+/, { timeout: 40_000 });
  await completeQuizSession(page);
  await page.waitForURL(/\/results\/.+\/.+/, { timeout: 40_000 });
  await context.close();
}

test.describe.serial('QUIZO local complete flow', () => {
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
    }
  });

  test('home, auth and AI TXT quiz generation work locally', async ({ page }) => {
    await signUpTestUser(page, 'ai');

    await page.goto('/create-quiz');
    await expect(page.getByRole('heading', { name: /Créer un nouveau quiz|Create a new quiz/i })).toBeVisible();

    await page.locator('input[type="file"]').setInputFiles({
      name: 'quizo-e2e-source.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from(
        'QUIZO utilise Firebase pour les données realtime, Supabase pour le stockage, Vercel pour le frontend et Flask sur Render pour la génération de quiz.'
      ),
    });

    await expect(page.getByText('quizo-e2e-source.txt')).toBeVisible({ timeout: 10_000 });
    await page.getByRole('button', { name: 'Groq' }).click();
    await page.getByRole('slider').press('ArrowLeft');
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/quiz-preview\/.+/, { timeout: 180_000 });
    await expect(page.locator('body')).toContainText(/Quiz|question/i);
  });

  test('manual quiz sharing, realtime dashboard, competition and leaderboard work locally', async ({ page, browser, baseURL }) => {
    page.on('console', msg => console.log(`[CREATOR CONSOLE] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[CREATOR ERROR] ${err.message}`));

    await signUpTestUser(page, 'manual');

    await page.goto('/create-manual-quiz');
    await page.locator('#title').fill('QUIZO E2E Manuel');
    await page.locator('#description').fill('Quiz manuel E2E local');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/manual-quiz-builder\/.+/, { timeout: 30_000 });

    const quizId = page.url().split('/').pop();
    expect(quizId).toBeTruthy();

    await addQuestion(page, 'Combien font 2 + 2 ?', ['4', '3', '5', '6']);
    await addQuestion(page, 'Quelle plateforme héberge le frontend ?', ['Vercel', 'Render', 'Firebase', 'Supabase']);
    await addQuestion(page, 'Quel service stocke les participants realtime ?', ['Firebase', 'Vercel', 'GitHub', 'Supabase']);

    await page.getByRole('button', { name: /Code/i }).first().click();
    const shareCode = (await page.locator('.font-mono').first().innerText()).trim();
    expect(shareCode).toMatch(/^[A-Z0-9]{6}$/);

    await page.goto(`/quiz-dashboard/${quizId}`);
    await expect(page.locator('body')).toContainText(/Participants|Total/i);

    await joinSharedQuiz(browser, baseURL!, shareCode);
    await expect(page.getByText(/Participant E2E/)).toBeVisible({ timeout: 40_000 });

    await page.goto(`/manual-quiz-builder/${quizId}`);
    await page.getByRole('button', { name: /Compétition|Competition/i }).click();
    await page.locator('#competition-title').fill('QUIZO E2E Compétition');
    await page.locator('#competition-description').fill('Compétition locale automatisée');

    const now = Date.now();
    await page.locator('#start-date').fill(localDateTime(new Date(now - 60_000)));
    await page.locator('#end-date').fill(localDateTime(new Date(now + 60 * 60_000)));
    await page.getByRole('button', { name: /Créer la compétition|Create competition/i }).click();
    await page.waitForURL(/\/creator-dashboard\/.+/, { timeout: 40_000 });

    const competitionId = page.url().split('/').pop();
    const competitionCode = (await page.getByTestId('competition-share-code').innerText()).trim();
    expect(competitionId).toBeTruthy();
    expect(competitionCode).toMatch(/^[A-Z0-9]{6}$/);

    const competitionContext = await browser.newContext();
    const competitorPage = await competitionContext.newPage();
    competitorPage.on('console', msg => console.log(`[COMPETITOR CONSOLE] ${msg.type()}: ${msg.text()}`));
    competitorPage.on('pageerror', err => console.log(`[COMPETITOR ERROR] ${err.message}`));

    await signUpTestUser(competitorPage, 'competitor');
    await competitorPage.goto(`${baseURL}/join/${competitionCode}`);
    await competitorPage.locator('#participant-name').fill('Compétiteur E2E');
    await competitorPage.getByRole('button', { name: /Rejoindre la compétition|Join/i }).click();
    await competitorPage.waitForURL(/\/competition\/.+/, { timeout: 40_000 });
    await completeQuizSession(competitorPage);
    await competitorPage.waitForURL(/\/leaderboard\/.+/, { timeout: 40_000 });
    await expect(competitorPage.locator('body')).toContainText(/Compétiteur E2E|Classement|Leaderboard/i);
    await competitionContext.close();

    await page.goto(`/leaderboard/${competitionId}`);
    await expect(page.locator('body')).toContainText(/Compétiteur E2E|Classement|Leaderboard/i, { timeout: 40_000 });
  });
});
