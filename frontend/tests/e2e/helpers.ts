import { Page, expect } from '@playwright/test';

const homePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Log selected environment variables to the console for debugging.
 * Pass an array of variable names, or log all NEXT_PUBLIC_ and NODE_ENV by default.
 */
export function logEnvVars(vars: string[] = []) {
  if (process.env.DEBUG_E2E !== '1') return;
  const allVars = vars.length
    ? vars
    : Object.keys(process.env).filter((k) => k.startsWith('NEXT_PUBLIC_') || k === 'NODE_ENV');
  // eslint-disable-next-line no-console
  console.log('Env vars:', Object.fromEntries(allVars.map((k) => [k, process.env[k]])));
}

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function createMockJwt(email: string) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64UrlEncode(JSON.stringify({ email }));
  return `${header}.${payload}.signature`;
}

/**
 * Common test setup - navigate to home and clear state for fresh start
 */
export async function setupFreshTest(page: Page) {
  await page.goto(homePath);
  // Clear localStorage for clean state
  await page.evaluate(() => localStorage.clear());
}

/**
 * Common test setup with authenticated user.
 */
export async function setupFreshTestAuthenticated(page: Page, email = 'e2e@example.com') {
  const token = createMockJwt(email);
  await page.addInitScript(
    ({ jwt }) => {
      if (typeof localStorage !== 'undefined') {
        const isInitialized = localStorage.getItem('__e2e_setup_done');
        if (!isInitialized) {
          localStorage.clear();
          localStorage.setItem('__e2e_setup_done', 'true');
        }
        localStorage.setItem('jwt', jwt);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    },
    { jwt: token }
  );
  await page.goto(homePath, { waitUntil: 'networkidle' });
}

/**
 * Test setup that makes sure any previous information is cleared.
 */
export async function setupSuperFreshTest(page: Page, seed?: string) {
  try {
    // Build the URL with seed if provided
    let url = homePath;
    if (seed) {
      url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
    }

    // Go to the URL (with or without seed)
    //await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.goto(url, { waitUntil: 'networkidle' });

    // Clear localStorage, sessionStorage, and cookies if accessible
    await page.evaluate(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    });
    await page.context().clearCookies();

    // Reload the page to reset the app state, with the seed param if provided
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.getByTestId('guest-login-btn').click();

    // Verify the app is in the initial state (area selection screen)
    await page.waitForSelector('text=¿Qué quieres estudiar?', { timeout: 10000 });
  } catch (error) {
    throw error; // Re-throw the error to ensure test fails with context
  }
}

/**
 * Test setup that makes sure any previous information is cleared and user is authenticated.
 */
export async function setupSuperFreshTestAuthenticated(
  page: Page,
  seed?: string,
  email = 'e2e@example.com'
) {
  const token = createMockJwt(email);
  let url = homePath;
  if (seed) {
    url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
  }
  await page.context().clearCookies();
  await page.addInitScript(
    ({ jwt }) => {
      if (typeof localStorage !== 'undefined') {
        const isInitialized = localStorage.getItem('__e2e_setup_done');
        if (!isInitialized) {
          localStorage.clear();
          localStorage.setItem('__e2e_setup_done', 'true');
        }
        localStorage.setItem('jwt', jwt);
      }
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    },
    { jwt: token }
  );
  await page.goto(url, { waitUntil: 'networkidle' });
}

/**
 * Wait for the quiz application to be in a ready state.
 * This is a more reliable way to wait than checking for specific DOM elements.
 */
export async function waitForAppReady(page: Page) {
  // Wait for the page to be fully loaded
  await page.waitForLoadState('networkidle');

  // Wait for the main app container to be visible
  await expect(page.locator('body')).toBeVisible();

  // Wait a moment for any JavaScript initialization
  await page.waitForTimeout(500);
}

/**
 * Wait for quiz to be loaded and ready for interaction.
 * This checks for either area selection or quiz interface.
 */
export async function waitForQuizReady(page: Page) {
  await waitForAppReady(page);

  try {
    // Wait for either area selection or quiz interface to appear
    await expect(
      page
        .getByText('¿Qué quieres estudiar?')
        .or(page.getByText('¿Cómo quieres las preguntas?'))
        .or(page.locator('.question-text'))
        .first() // Take the first match to avoid strict mode violations
    ).toBeVisible();
  } catch (error) {
    // Optionally log error for debugging
    throw error; // Re-throw the error to ensure test fails with context
  }
}

/**
 * Navigate to a study area and start quiz.
 * Encapsulates the common pattern used across many tests.
 */
export async function startQuiz(
  page: Page,
  areaName: string,
  quizType: 'Todas las preguntas' | 'Seleccionar secciones' = 'Todas las preguntas'
) {
  await waitForAppReady(page);

  await page.getByRole('button', { name: new RegExp(areaName) }).click();
  await page.getByRole('button', { name: quizType }).click();

  await waitForQuizReady(page);
}

type QuizMode = 'all' | 'sections' | 'questions';
type QuestionOrder = 'sequential' | 'random';
type AnswerOrder = 'sequential' | 'random';

const quizModeToTestId: Record<QuizMode, string> = {
  all: 'quiz-all-button',
  sections: 'quiz-sections-button',
  questions: 'quiz-questions-button',
};

const orderToTestId: Record<QuestionOrder, string> = {
  sequential: 'order-sequential-button',
  random: 'order-random-button',
};

const answerOrderToTestId: Record<AnswerOrder, string> = {
  sequential: 'answer-order-sequential-button',
  random: 'answer-order-random-button',
};

/**
 * Navigate to a study area and start quiz using test ids.
 */
export async function startQuizByTestId(
  page: Page,
  areaShortName: string,
  options: { mode?: QuizMode; order?: QuestionOrder; answerOrder?: AnswerOrder } = {}
) {
  await waitForAppReady(page);

  const mode = options.mode ?? 'all';
  const areaButton = page.getByTestId(`area-${areaShortName}`);
  const selectionMenu = page.getByTestId('selection-menu');
  if (await areaButton.isVisible().catch(() => false)) {
    await areaButton.click();
  }
  await selectionMenu.waitFor({ timeout: 20000 });
  if (options.order) {
    await page.getByTestId(orderToTestId[options.order]).click();
  }
  if (options.answerOrder) {
    await page.getByTestId(answerOrderToTestId[options.answerOrder]).click();
  }
  await page.getByTestId(quizModeToTestId[mode]).click();

  if (mode === 'all') {
    await waitForQuizReady(page);
  } else {
    await page.getByTestId('start-quiz-button').waitFor({ timeout: 20000 });
  }
}

/**
 * Navigate to a study area and land on the selection menu without starting a quiz.
 */
export async function openSelectionMenuByTestId(
  page: Page,
  areaShortName: string,
  options: { order?: QuestionOrder; answerOrder?: AnswerOrder } = {}
) {
  await waitForAppReady(page);
  await page.getByTestId(`area-${areaShortName}`).click();
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  if (options.order) {
    await page.getByTestId(orderToTestId[options.order]).click();
  }
  if (options.answerOrder) {
    await page.getByTestId(answerOrderToTestId[options.answerOrder]).click();
  }
}
