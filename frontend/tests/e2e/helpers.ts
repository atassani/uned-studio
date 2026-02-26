import { Page, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const homePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testdataDir = path.resolve(__dirname, '../testdata');

const testDataRoutes: Array<{ requestFile: string; fixtureFile: string }> = [
  // Always serve test areas, even if app asks for default areas.json.
  { requestFile: 'areas.json', fixtureFile: 'areas-mcq-tests.json' },
  { requestFile: 'areas-mcq-tests.json', fixtureFile: 'areas-mcq-tests.json' },
  { requestFile: 'questions-mcq-tests.json', fixtureFile: 'questions-mcq-tests.json' },
  { requestFile: 'questions-logica1.json', fixtureFile: 'questions-logica1.json' },
  { requestFile: 'questions-ipc.json', fixtureFile: 'questions-ipc.json' },
  { requestFile: 'questions-fdl.json', fixtureFile: 'questions-fdl.json' },
];

function buildDataRoutePattern(fileName: string) {
  // Match fixture requests regardless of base path/host and tolerate query/trailing-slash variants.
  return `**/${fileName}*`;
}

export async function setupTestDataRoutes(page: Page) {
  for (const routeDef of testDataRoutes) {
    const pattern = buildDataRoutePattern(routeDef.requestFile);
    await page.route(pattern, async (route) => {
      const filePath = path.join(testdataDir, routeDef.fixtureFile);
      const body = fs.readFileSync(filePath, 'utf8');
      await route.fulfill({
        status: 200,
        body,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
        },
      });
    });
  }
}

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
  await setupTestDataRoutes(page);
  await page.goto(homePath);
  // Clear localStorage for clean state
  await page.evaluate(() => localStorage.clear());
}

/**
 * Common test setup with authenticated user.
 */
export async function setupFreshTestAuthenticated(page: Page, email = 'e2e@example.com') {
  await setupTestDataRoutes(page);
  await page.context().clearCookies();
  await bootstrapAuthenticatedPage(page, homePath, email);
}

async function addAuthenticatedInitScript(page: Page, jwt: string, runId: string) {
  await page.addInitScript(
    ({ token, id }) => {
      const setupKey = `__e2e_setup_done_${id}`;
      if (typeof localStorage === 'undefined') return;

      const alreadyInitialized =
        typeof sessionStorage !== 'undefined' && sessionStorage.getItem(setupKey) === '1';
      if (!alreadyInitialized) {
        localStorage.clear();
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(setupKey, '1');
        }
      }
      localStorage.setItem('jwt', token);
    },
    { token: jwt, id: runId }
  );
}

async function bootstrapAuthenticatedPage(page: Page, url: string, email: string) {
  const token = createMockJwt(email);
  const runId = `${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await addAuthenticatedInitScript(page, token, runId);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  await ensureAreaConfigurationResolved(page);
  await ensureAreaSelectionVisible(page);
}

async function ensureAreaConfigurationResolved(page: Page) {
  const configView = page.getByTestId('area-configuration-view');
  const acceptButton = page.getByTestId('area-config-accept');
  const anyAreaSelectionButton = page
    .locator('[data-testid^="area-"]:not([data-testid^="area-config"])')
    .first();
  if (await configView.isVisible().catch(() => false)) {
    await acceptButton.click();
    await anyAreaSelectionButton.waitFor({ state: 'visible', timeout: 20000 });
  }
}

/**
 * Test setup that makes sure any previous information is cleared.
 */
export async function setupSuperFreshTest(page: Page, seed?: string) {
  await setupTestDataRoutes(page);
  let url = homePath;
  if (seed) {
    url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
  }

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
  });
  await page.context().clearCookies();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('guest-login-btn').click();
  await page.waitForSelector('text=¿Qué quieres estudiar?', { timeout: 10000 });
}

/**
 * Test setup that makes sure any previous information is cleared and user is authenticated.
 */
export async function setupSuperFreshTestAuthenticated(
  page: Page,
  seed?: string,
  email = 'e2e@example.com'
) {
  await setupTestDataRoutes(page);
  await page.context().clearCookies();
  let url = homePath;
  if (seed) {
    url += (url.includes('?') ? '&' : '?') + `seed=${encodeURIComponent(seed)}`;
  }
  await bootstrapAuthenticatedPage(page, url, email);
}

/**
 * Wait for the quiz application to be in a ready state.
 * This is a more reliable way to wait than checking for specific DOM elements.
 */
export async function waitForAppReady(page: Page) {
  for (let attempt = 0; attempt < 2; attempt++) {
    // Wait for the page to be fully loaded
    await page.waitForLoadState('domcontentloaded');

    // Wait for the main app container to be visible
    await expect(page.locator('body')).toBeVisible();

    const runtimeChunkErrorVisible = await page
      .getByRole('dialog', { name: /Runtime ChunkLoadError/i })
      .isVisible()
      .catch(() => false);
    const applicationErrorVisible = await page
      .getByRole('heading', { name: /Application error: a client-side exception/i })
      .isVisible()
      .catch(() => false);

    if (runtimeChunkErrorVisible || applicationErrorVisible) {
      if (attempt === 0) {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
        continue;
      }
    }

    // Wait a moment for any JavaScript initialization
    await page.waitForTimeout(500);
    return;
  }
}

/**
 * Wait for quiz to be loaded and ready for interaction.
 * This checks for either area selection or quiz interface.
 */
export async function waitForQuizReady(page: Page) {
  await waitForAppReady(page);
  await expect(
    page
      .getByText('¿Qué quieres estudiar?')
      .or(page.getByText('¿Cómo quieres las preguntas?'))
      .or(page.locator('.question-text'))
      .first()
  ).toBeVisible();
}

export async function ensureAreaSelectionVisible(page: Page) {
  const anyAreaButton = page
    .locator('[data-testid^="area-"]:not([data-testid^="area-config"])')
    .first();
  const selectionMenu = page.getByTestId('selection-menu');
  const optionsButton = page.getByTestId('options-button');
  const changeAreaButton = page.getByTestId('change-area-button').first();
  const loadingSpinner = page.getByTestId('loading-spinner');
  const configView = page.getByTestId('area-configuration-view');

  for (let attempt = 0; attempt < 3; attempt++) {
    if (await anyAreaButton.isVisible().catch(() => false)) {
      return;
    }

    if (await configView.isVisible().catch(() => false)) {
      await ensureAreaConfigurationResolved(page);
      if (await anyAreaButton.isVisible().catch(() => false)) {
        return;
      }
    } else if (await selectionMenu.isVisible().catch(() => false)) {
      await changeAreaButton.click({ force: true });
      await anyAreaButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      if (await anyAreaButton.isVisible().catch(() => false)) {
        return;
      }
    } else if (await optionsButton.isVisible().catch(() => false)) {
      await optionsButton.click({ force: true });
      await changeAreaButton.click({ force: true });
      await anyAreaButton.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      if (await anyAreaButton.isVisible().catch(() => false)) {
        return;
      }
    } else if (await loadingSpinner.isVisible().catch(() => false)) {
      await page.waitForTimeout(1000);
    } else {
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await waitForAppReady(page);
    }
  }
  if (await configView.isVisible().catch(() => false)) {
    await ensureAreaConfigurationResolved(page);
  }
  const canonicalAreasPath = `${homePath.replace(/\/$/, '')}/areas`;
  await page.goto(canonicalAreasPath || '/areas', { waitUntil: 'domcontentloaded' });
  await waitForAppReady(page);
  if (await configView.isVisible().catch(() => false)) {
    await ensureAreaConfigurationResolved(page);
  }
  if (!(await anyAreaButton.isVisible().catch(() => false))) {
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 20000 });
    await waitForAppReady(page);
    if (await configView.isVisible().catch(() => false)) {
      await ensureAreaConfigurationResolved(page);
    }
  }
  await anyAreaButton.waitFor({ state: 'visible', timeout: 30000 });
}

async function ensureSelectionMenuForArea(page: Page, areaShortName: string) {
  const areaButton = page.getByTestId(`area-${areaShortName}`);
  const selectionMenu = page.getByTestId('selection-menu');
  const optionsButton = page.getByTestId('options-button');
  const questionView = page.getByTestId('question-view');

  if (await selectionMenu.isVisible().catch(() => false)) {
    return;
  }

  if (await areaButton.isVisible().catch(() => false)) {
    await areaButton.click();
    await selectionMenu.waitFor({ timeout: 20000 });
    return;
  }

  if (
    (await optionsButton.isVisible().catch(() => false)) ||
    (await questionView.isVisible().catch(() => false))
  ) {
    await optionsButton.click();
    await page.getByTestId('change-area-button').first().click();
    await areaButton.waitFor({ timeout: 20000 });
    await areaButton.click();
    await selectionMenu.waitFor({ timeout: 20000 });
    return;
  }

  await ensureAreaSelectionVisible(page);
  if (!(await areaButton.isVisible().catch(() => false))) {
    const configView = page.getByTestId('area-configuration-view');
    if (await configView.isVisible().catch(() => false)) {
      await ensureAreaConfigurationResolved(page);
    }
    await areaButton.waitFor({ timeout: 20000 });
  }
  await areaButton.click();
  await selectionMenu.waitFor({ timeout: 20000 });
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
  await ensureSelectionMenuForArea(page, areaShortName);
  if (options.order) {
    await page.getByTestId(orderToTestId[options.order]).click({ force: true });
  }
  if (options.answerOrder) {
    await page.getByTestId(answerOrderToTestId[options.answerOrder]).click({ force: true });
  }
  await page.getByTestId(quizModeToTestId[mode]).click({ force: true });

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
  await ensureSelectionMenuForArea(page, areaShortName);
  if (options.order) {
    await page.getByTestId(orderToTestId[options.order]).click({ force: true });
  }
  if (options.answerOrder) {
    await page.getByTestId(answerOrderToTestId[options.answerOrder]).click({ force: true });
  }
}
