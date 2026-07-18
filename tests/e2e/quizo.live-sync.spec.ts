import { expect, test } from '@playwright/test';

const PASSWORD = 'QuizoSyncTest123!';

const uniqueEmail = (label: string) =>
  `quizo.sync.${label}.${Date.now()}.${Math.floor(Math.random() * 10000)}@example.com`;

const localDateTime = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

async function signUpUser(page: any, name: string, email: string) {
  await page.goto('/');
  await expect(page.locator('body')).toContainText(/QUIZO/i);

  await page.getByRole('button', { name: /Connexion|Login|Se connecter/i }).click();
  await page.getByRole('tab', { name: /Inscription|Sign up/i }).click();
  await page.locator('#signup-name').fill(name);
  await page.locator('#signup-email').fill(email);
  await page.locator('#signup-password').fill(PASSWORD);
  await page.getByRole('button', { name: /Créer un compte|Create account/i }).click();

  await expect(page.getByRole('link', { name: /Créer un Quiz IA|Create AI Quiz/i }).first()).toBeVisible({ timeout: 30_000 });
}

test.describe('QUIZO Live Synchronous Quiz E2E Flow', () => {
  test('Orchestrates a complete teacher-led live multiplayer quiz session', async ({ browser, baseURL }) => {
    // 1. Spawns Creator/Host Browser Page
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    
    console.log('Host: Signing up...');
    const hostEmail = uniqueEmail('host');
    await signUpUser(hostPage, 'QuizMaster Host', hostEmail);

    // 2. Host creates a Manual Quiz
    console.log('Host: Creating a manual quiz...');
    await hostPage.goto('/create-manual-quiz');
    await hostPage.locator('#title').fill('Live Sync Quiz');
    await hostPage.locator('#description').fill('Multiplayer synchronous testing quiz');
    await hostPage.locator('button[type="submit"]').click();
    await hostPage.waitForURL(/\/manual-quiz-builder\/.+/, { timeout: 30_000 });

    const quizId = hostPage.url().split('/').pop();
    expect(quizId).toBeTruthy();

    // 3. Add questions to the Quiz
    console.log('Host: Adding questions...');
    // Question 1
    await hostPage.getByRole('button', { name: /Ajouter une question/i }).first().click();
    await hostPage.locator('#question-text').fill('Quelle est la couleur du cheval blanc d\'Henri IV ?');
    await hostPage.getByPlaceholder(/Option 1/i).fill('Blanc');
    await hostPage.getByPlaceholder(/Option 2/i).fill('Noir');
    await hostPage.getByPlaceholder(/Option 3/i).fill('Gris');
    await hostPage.getByPlaceholder(/Option 4/i).fill('Marron');
    await hostPage.getByRole('button', { name: /^Ajouter$/i }).click();
    await expect(hostPage.getByText('Henri IV')).toBeVisible({ timeout: 20_000 });

    // 4. Host creates a Synchronous Competition (Teacher-led)
    console.log('Host: Launching Competition in live mode...');
    await hostPage.getByRole('button', { name: /Compétition/i }).click();
    await hostPage.locator('#competition-title').fill('Live Sync Competition');
    await hostPage.locator('#competition-description').fill('Live multiplayer synchronized test');
    
    // Choose mode: Teacher-Led (Synchronous)
    await hostPage.getByRole('button', { name: /Teacher-led/i }).click();
    
    const now = Date.now();
    await hostPage.locator('#start-date').fill(localDateTime(new Date(now - 60_000)));
    await hostPage.locator('#end-date').fill(localDateTime(new Date(now + 3600 * 1000)));
    
    await hostPage.getByRole('button', { name: /Créer la compétition/i }).click();
    await hostPage.waitForURL(/\/live-session\/.+/, { timeout: 40_000 });

    const competitionId = hostPage.url().split('/').pop();
    expect(competitionId).toBeTruthy();

    // 5. Host fetches the share code
    const shareCodeText = (await hostPage.locator('span.font-mono').first().innerText()).trim();
    console.log(`Host: Share code generated is ${shareCodeText}`);
    expect(shareCodeText).toMatch(/^[A-Z0-9]{6}$/);

    // 6. Spawns Participant 1 Context
    console.log('Participant 1: Signing up and joining WaitRoom...');
    const p1Context = await browser.newContext();
    const p1Page = await p1Context.newPage();
    const p1Email = uniqueEmail('p1');
    await signUpUser(p1Page, 'Player One', p1Email);

    await p1Page.goto(`/join/${shareCodeText}`);
    await p1Page.locator('#participant-name').fill('Player One');
    await p1Page.getByRole('button', { name: /Rejoindre/i }).click();
    
    // Wait until waitroom lobby mounts
    await expect(p1Page.getByText(/Prêt à jouer, Player One/i)).toBeVisible({ timeout: 30_000 });

    // 7. Spawns Participant 2 Context
    console.log('Participant 2: Signing up and joining WaitRoom...');
    const p2Context = await browser.newContext();
    const p2Page = await p2Context.newPage();
    const p2Email = uniqueEmail('p2');
    await signUpUser(p2Page, 'Player Two', p2Email);

    await p2Page.goto(`/join/${shareCodeText}`);
    await p2Page.locator('#participant-name').fill('Player Two');
    await p2Page.getByRole('button', { name: /Rejoindre/i }).click();
    
    await expect(p2Page.getByText(/Prêt à jouer, Player Two/i)).toBeVisible({ timeout: 30_000 });

    // 8. Host verifies both players are connected in the Waiting Room
    console.log('Host: Verifying player lobby entries...');
    await expect(hostPage.getByText('Player One')).toBeVisible({ timeout: 20_000 });
    await expect(hostPage.getByText('Player Two')).toBeVisible({ timeout: 20_000 });

    // 9. Host starts the game
    console.log('Host: Launching the game...');
    await hostPage.getByRole('button', { name: /Lancer la partie/i }).click();

    // Verify both participants enter the synchronized countdown/question screen
    console.log('Participants: Verifying question sync...');
    await expect(p1Page.getByText(/Henri IV/i)).toBeVisible({ timeout: 20_000 });
    await expect(p2Page.getByText(/Henri IV/i)).toBeVisible({ timeout: 20_000 });

    // 10. Participants answer the question
    console.log('Participant 1: Answering Blanc...');
    await p1Page.getByRole('button', { name: /▲ Blanc/i }).click();
    await expect(p1Page.getByText(/Réponse bien enregistrée/i)).toBeVisible({ timeout: 15_000 });

    console.log('Participant 2: Answering Noir...');
    await p2Page.getByRole('button', { name: /◆ Noir/i }).click();
    await expect(p2Page.getByText(/Réponse bien enregistrée/i)).toBeVisible({ timeout: 15_000 });

    // 11. Host reveals the answers
    console.log('Host: Revealing correct answer...');
    await hostPage.getByRole('button', { name: /Révéler la bonne réponse/i }).click();

    // 12. Check reveal feedbacks on participant screens
    console.log('Participants: Verifying correct/incorrect splash screens...');
    await expect(p1Page.getByText(/CORRECT !/i)).toBeVisible({ timeout: 15_000 });
    await expect(p2Page.getByText(/INCORRECT/i)).toBeVisible({ timeout: 15_000 });

    // 13. Host goes to Intermediate Leaderboard
    console.log('Host: Transitioning to intermediate leaderboard...');
    await hostPage.getByRole('button', { name: /Voir le classement/i }).click();

    // Participants should automatically sync to Leaderboard
    await expect(p1Page.getByText(/Classement en Direct/i)).toBeVisible({ timeout: 15_000 });
    await expect(p2Page.getByText(/Classement en Direct/i)).toBeVisible({ timeout: 15_000 });

    // 14. Host ends the quiz (completes)
    console.log('Host: Completing the session...');
    await hostPage.getByRole('button', { name: /Terminer le quiz/i }).click();

    // Verify completed podium state and cleanup contexts
    await expect(p1Page.getByText(/Podium Final/i)).toBeVisible({ timeout: 20_000 });
    await expect(p2Page.getByText(/Podium Final/i)).toBeVisible({ timeout: 20_000 });

    await hostContext.close();
    await p1Context.close();
    await p2Context.close();
    console.log('Test completed successfully!');
  });
});
