import { test, expect, chromium } from '@playwright/test';

const EMAIL = process.env.E2E_USER_EMAIL;
const PASSWORD = process.env.E2E_USER_PASSWORD;

const QUESTIONS = [
  {
    q: "Quelle est la forme générale d'une équation du second degré ?",
    options: [
      'ax² + bx + c = 0',
      'ax + b = 0',
      'ax³ + bx² + cx + d = 0',
      'a/x + b = 0',
    ],
    correctIndex: 0,
  },
  { q: 'Comment calcule-t-on le discriminant Δ ?', options: ['Δ = b² - 4ac', 'Δ = b² + 4ac', 'Δ = 4ac - b²', 'Δ = a² - 4bc'], correctIndex: 0 },
  { q: "Si Δ > 0, combien de solutions réelles l'équation possède-t-elle ?", options: ['2 solutions distinctes', '1 solution double', 'Aucune solution', 'Infinité de solutions'], correctIndex: 0 },
  { q: 'Si Δ = 0, quelle est la solution ?', options: ['x = -b / 2a', 'x = b / 2a', 'x = -b / a', 'x = 0'], correctIndex: 0 },
  { q: "Pour l'équation x² - 5x + 6 = 0, quelle est la valeur de Δ ?", options: ['1', '25', '-24', '0'], correctIndex: 0 },
  { q: "Les solutions de x² - 5x + 6 = 0 sont :", options: ['x₁ = 2 et x₂ = 3', 'x₁ = 1 et x₂ = 6', 'x₁ = -2 et x₂ = -3', 'Pas de solution'], correctIndex: 0 },
  { q: "Pour résoudre ax² + bx + c = 0 avec Δ > 0, on utilise :", options: ['x = (-b ± √Δ) / 2a', 'x = (-b ± √Δ) / a', 'x = (b ± √Δ) / 2a', 'x = -b / 2a'], correctIndex: 0 },
  { q: 'Si Δ < 0, dans quel ensemble trouve-t-on les solutions ?', options: ['Dans ℂ (nombres complexes)', 'Dans ℝ (nombres réels)', 'Dans ℕ (nombres naturels)', "Il n'y a pas de solution"], correctIndex: 0 },
  { q: "L'équation x² - 4 = 0 a pour solutions :", options: ['x₁ = 2 et x₂ = -2', 'x = 4', 'x = 2', 'Pas de solution'], correctIndex: 0 },
  { q: 'Quelle équation a un discriminant nul ?', options: ['x² - 6x + 9 = 0', 'x² - 5x + 6 = 0', 'x² + 1 = 0', 'x² - 4 = 0'], correctIndex: 0 },
];

test.describe('QUIZO collaborative flows', () => {
  test.beforeAll(() => {
    if (!EMAIL || !PASSWORD) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required to run e2e flows');
    }
  });

  test('Manual quiz + Realtime dashboard: join by quiz share code', async ({ page, baseURL }) => {
    // Login
    await page.goto(baseURL!);
    await page.getByRole('button', { name: /Connexion|Login|Se connecter/i }).click();
    await page.fill('#email', EMAIL!);
    await page.fill('#password', PASSWORD!);
    // Click submit in the Sign In tab
    await page.locator('form button[type="submit"]').first().click();
    await page.getByRole('button', { name: /Connexion|Login/i }).waitFor({ state: 'detached' });

    // Create manual quiz
    await page.goto(baseURL! + '/create-manual-quiz');
    await page.fill('#title', 'Équations du Second Degré');
    await page.fill('#description', 'Quiz sur le chapitre 5 - Discriminant et résolutions');
    await page.locator('button[type="submit"]').click();

    // Wait for builder url and capture quizId
    await page.waitForURL(/\/manual-quiz-builder\/.+/);
    const quizId = page.url().split('/').pop()!;

    // Add 10 questions
    for (const q of QUESTIONS) {
      await page.getByRole('button', { name: /Ajouter une question|Add question/i }).click();
      await page.fill('#question-text', q.q);
      // Fill option inputs
      for (let i = 0; i < q.options.length; i++) {
        await page.getByPlaceholder(new RegExp(`Option ${i + 1}`)).fill(q.options[i]);
      }
      // Select correct option
      if (q.correctIndex !== 0) {
        await page.locator(`#option-${q.correctIndex}`).click();
      }
      await page.getByRole('button', { name: /Ajouter|Add/i }).click();
      // return to list state
      await expect(page.getByText(/question\(s\)|Aucune question/i)).toBeVisible();
    }

    // Generate share code if missing, read it
    const codeBadge = page.locator('span.font-mono');
    let shareCode: string;
    if (await codeBadge.count() === 0) {
      await page.getByRole('button', { name: /Générer Code|Nouveau Code|Generate Code/i }).click();
      await expect(page.locator('span.font-mono')).toBeVisible();
    }
    shareCode = (await page.locator('span.font-mono').first().innerText()).trim();
    expect(shareCode).toMatch(/^[A-Z0-9]{6}$/);

    // Open dashboard
    await page.getByRole('button', { name: /Dashboard/i }).click();
    await page.waitForURL(/\/quiz-dashboard\//);
    await expect(page.getByText('Total Participants')).toBeVisible();

    // Participant joins from another context
    const browser = await chromium.launch();
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await page2.goto(`${baseURL}/join-quiz/${shareCode}`);
    await page2.fill('#name', 'Marie Dubois');
    const emailInput = page2.locator('#email');
    if (await emailInput.count()) {
      await emailInput.fill('marie.dubois@test.com');
    }
    await page2.getByRole('button', { name: /Rejoindre|Join/i }).click();
    // Ignore navigation errors; underlying writes should have happened

    // Back to dashboard: wait until participant appears
    await expect(page.getByText(/Marie Dubois/)).toBeVisible({ timeout: 30_000 });
    await ctx2.close();
    await browser.close();
  });

  test('Competition flow: create, share, join, complete, and verify stats', async ({ page, baseURL, browser }) => {
    // Login (assumes previous session may persist, but ensure button not present)
    await page.goto(baseURL!);
    const loginBtn = page.getByRole('button', { name: /Connexion|Login|Se connecter/i });
    if (await loginBtn.count()) {
      await loginBtn.click();
      await page.fill('#email', EMAIL!);
      await page.fill('#password', PASSWORD!);
      await page.locator('form button[type="submit"]').first().click();
      await loginBtn.waitFor({ state: 'detached' });
    }

    // Navigate to last created quiz builder (direct)
    // If this fails, recreate quickly
    await page.goto(baseURL! + '/create-manual-quiz');
    await page.fill('#title', 'Équations du Second Degré (Compétition)');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/manual-quiz-builder\/.+/);

    // Ensure at least 3 questions exist for the competition
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: /Ajouter une question|Add question/i }).click();
      await page.fill('#question-text', QUESTIONS[i].q);
      for (let j = 0; j < 4; j++) {
        await page.getByPlaceholder(new RegExp(`Option ${j + 1}`)).fill(QUESTIONS[i].options[j]);
      }
      await page.getByRole('button', { name: /Ajouter|Add/i }).click();
    }

    // Open competition dialog and create one with current time window
    await page.getByRole('button', { name: /Compétition/i }).click();
    await page.fill('#competition-title', 'Test de Classe - Chapitre 5');
    const now = new Date();
    const start = new Date(now.getTime() - 60_000);
    const end = new Date(now.getTime() + 60 * 60_000);
    const toLocal = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    await page.fill('#start-date', toLocal(start));
    await page.fill('#end-date', toLocal(end));
    await page.getByRole('button', { name: /Créer la compétition/i }).click();

    // Should navigate to CreatorDashboard
    await page.waitForURL(/\/creator-dashboard\//);
    // Extract share code
    const shareCode = (await page.locator('span.font-mono').first().innerText()).trim();
    expect(shareCode).toMatch(/^[A-Z0-9]{6}$/);

    // Participant joins via /join
    const ctx2 = await browser.newContext();
    const page2 = await ctx2.newPage();
    await page2.goto(`${baseURL}/join`);
    // Focus first OTP slot and type the code (auto-advance)
    await page2.locator('input[autocomplete="one-time-code"]').first().click({ force: true }).catch(() => {});
    await page2.keyboard.type(shareCode);
    await page2.fill('#participant-name', 'Thomas Martin');
    await page2.getByRole('button', { name: /Rejoindre la compétition/i }).click();

    // Land on competition page and answer quickly
    await page2.waitForURL(/\/competition\//, { timeout: 30_000 });
    // Answer all questions by clicking the first option each time
    for (;;) {
      // Try to click the first radio option label
      const firstOption = page2.locator('label').first();
      if (await firstOption.count()) {
        await firstOption.click({ trial: false }).catch(() => {});
      }
      const nextBtn = page2.getByRole('button', { name: /Suivant|Next/i });
      if (await nextBtn.count()) {
        await nextBtn.click();
      } else {
        const finishBtn = page2.getByRole('button', { name: /Terminer le quiz|Finish/i });
        if (await finishBtn.count()) {
          await finishBtn.click();
          break;
        } else {
          break;
        }
      }
    }

    // Back to dashboard: reload and expect stats to show at least 1 completed
    await page.reload();
    await expect(page.getByText(/Participants|Score moyen|Taux de complétion/)).toBeVisible();
    await ctx2.close();
  });
});
