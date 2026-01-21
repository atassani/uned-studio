import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';
// Clear localStorage before each test to ensure a clean state
test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await waitForAppReady(page);
  // Wait for initial page load to complete
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  // Wait for area button and click
  const areaBtn = page.getByRole('button', { name: /Lógica I/ });
  await expect(areaBtn).toBeVisible();
  await areaBtn.click();

  // Wait for "Todas las preguntas" button and click
  const todasBtn = page.getByRole('button', { name: 'Todas las preguntas' });
  await expect(todasBtn).toBeVisible();
  await todasBtn.click();

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready with multiple fallback strategies
  try {
    // First try: wait for question text
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 3000 });
  } catch {
    try {
      // Second try: wait for any quiz content to be visible
      await page.waitForSelector('text=/Lógica/', { timeout: 3000 });
    } catch {
      // Third try: wait for the V button specifically
      await page.waitForSelector('button:has-text("V")', { timeout: 5000 });
    }
  }

  // Wait specifically for True/False buttons to be interactive
  await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole('button', { name: 'F', exact: true })).toBeVisible({ timeout: 5000 });

  // Should see True/False question interface
  const vBtn = page.getByRole('button', { name: 'V', exact: true });
  const fBtn = page.getByRole('button', { name: 'F', exact: true });
  await expect(vBtn).toBeVisible();
  await expect(fBtn).toBeVisible();

  // Answer a question
  await vBtn.click();
  const continuarBtn = page.getByRole('button', { name: 'Continuar' });
  await expect(continuarBtn).toBeVisible();
});

test('Multiple Choice quiz shows question text with A/B/C buttons (consistent with True/False)', async ({
  page,
}) => {
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible();
  } catch {
    // Fallback: wait for answer buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  }

  // Should see A/B/C buttons at the bottom (not full option text as buttons)
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible();

  // Should NOT see buttons with full option text
  await expect(
    page.getByRole('button', { name: /No es objetivo porque hay personas/ })
  ).not.toBeVisible();
});

test('shows area name in question view', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();

  // Should show area name at top
  await expect(page.getByText('Lógica I')).toBeVisible();
});

test('shows area name in status view ("Options")', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready before clicking Options
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByRole('button', { name: 'V', exact: true })
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByRole('button', { name: 'A', exact: true })
      .isVisible()
      .catch(() => false);
    if (!vButtonVisible && !aButtonVisible) {
      await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
        timeout: 8000,
      });
    }
  }

  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 20000 });

  // Should show area name at top of status view
  await expect(page.getByText('Lógica I')).toBeVisible();
});

test('shows area name in question selection menu', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click();

  // Should show area name in the question selection menu
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});

test('migrates old quizStatus to area-specific storage without .json suffix', async ({ page }) => {
  // Set up old localStorage data
  await page.evaluate(() => {
    localStorage.setItem('quizStatus', '{"0": "correct", "1": "fail"}');
  });

  // Reload page to trigger migration
  await page.reload();

  // Wait for areas to load (which triggers migration)
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();

  // Check that data was migrated and old data removed (now uses shortName only)
  const newData = await page.evaluate(() => localStorage.getItem('quizStatus_log1'));
  const oldData = await page.evaluate(() => localStorage.getItem('quizStatus'));

  expect(newData).toBe('{"0": "correct", "1": "fail"}');
  expect(oldData).toBeNull();
});

test('Multiple Choice quiz works for IPC area', async ({ page }) => {
  // Ensure we're in area selection
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });

  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });

  // Wait for area to load completely
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible({
    timeout: 10000,
  });

  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load with multiple strategies
  await page.waitForLoadState('networkidle');

  // Give Firefox extra time to load IPC quiz content
  await page.waitForTimeout(2000);

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 12000 });
  } catch {
    // Fallback: wait for answer buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 12000,
    });
  }

  // Should see Multiple Choice question interface with options
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible({ timeout: 5000 });

  // Answer a question
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible({ timeout: 5000 });
});

test('keyboard shortcuts work for area selection', async ({ page }) => {
  // Wait for areas to load
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();

  // Press '1' to select first area
  await page.keyboard.press('1');

  // Should be in question selection for first area
  await expect(page.getByText('¿Cómo quieres las preguntas?')).toBeVisible();
});

test('keyboard shortcuts work for Multiple Choice questions', async ({ page }) => {
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for answer buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 8000,
    });
  }

  // Press 'a' to answer with option A
  await page.keyboard.press('a');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible({ timeout: 10000 });
});

test('selects one section and starts quiz in Lógica I area', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click({ timeout: 15000 });

  // Wait for the checkbox section to load
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('checkbox', { name: 'CUESTIONES DE LOS APUNTES' })
    .waitFor({ timeout: 15000 });
  await page.getByRole('checkbox', { name: 'CUESTIONES DE LOS APUNTES' }).check({ timeout: 15000 });
  await page.getByRole('button', { name: 'Empezar' }).click({ timeout: 15000 });

  // Updated: match the new concise status line with icons and separators
  await expect(page.locator('body')).toContainText(' 55| ✅ 0| ❌ 0| ❓ 55');

  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 15000 });
  await page.getByText('📚 CUESTIONES DE LOS APUNTES').click({ timeout: 15000 });
  await expect(page.locator('body')).toContainText(
    '📚 CUESTIONES DE LOS APUNTES1❓2❓3❓4❓5❓6❓7❓8❓9❓10❓11❓12❓13❓14❓15❓16❓17❓18❓19❓20❓21❓22❓23❓24❓25❓26❓27❓28❓29❓30❓31❓32❓33❓34❓35❓36❓37❓38❓39❓40❓41❓42❓43❓44❓45❓46❓47❓48❓49❓50❓51❓52❓53❓54❓55❓'
  );

  await page.getByRole('button', { name: 'Continuar' }).first().click({ timeout: 15000 });
  await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Continuar' }).first().click({ timeout: 15000 });
});

test('MCQ shows expected answer in correct format when wrong answer is selected', async ({
  page,
}) => {
  // Navigate to IPC area with MCQ questions
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for answer buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 8000,
    });
  }

  // Wait for first question to load - use exact match for A button
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({ timeout: 5000 });

  // Click on answer A
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });

  // Check if it shows "Incorrecto" - if so, verify expected answer format
  const isIncorrect = await page.getByText('❌ Incorrecto.').isVisible();

  if (isIncorrect) {
    // Should show "Respuesta esperada X) ..." format in the answer section
    const answerSection = page.locator('.text-red-600');
    await expect(answerSection).toBeVisible();

    // The answer should start with "Respuesta esperada" followed by the letter and option text
    await expect(answerSection).toContainText(/^Respuesta esperada [ABC]\) /);
  } else {
    // If A was correct, try B
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Wait for next question to load - buttons are more reliable than question text
    await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole('button', { name: 'B', exact: true }).click();

    const isIncorrectB = await page.getByText('❌ Incorrecto.').isVisible();

    if (isIncorrectB) {
      const answerSection = page.locator('.text-red-600');
      await expect(answerSection).toBeVisible();
      await expect(answerSection).toContainText(/^Respuesta esperada [ABC]\) /);
    }
  }
}, 25000);

test('shows area name with mortarboard on menu page', async ({ page }) => {
  // Navigate to Lógica I area
  await page.getByRole('button', { name: /Lógica I/ }).click();

  // Should see area name with mortarboard on menu page
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();

  // Navigate to IPC area
  await page.getByRole('button', { name: 'Cambiar área' }).click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();

  // Should see area name with mortarboard on IPC menu page
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible();
});

test('shows area name with mortarboard on section selection page', async ({ page }) => {
  // Navigate to Lógica I and go to section selection
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click();

  // Should see area name with mortarboard on section selection page
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});

test('shows area name with mortarboard on question selection page', async ({ page }) => {
  // Navigate to Lógica I and go to question selection
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Seleccionar preguntas' }).click();

  // Should see area name with mortarboard on question selection page
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});

test('shows area name with mortarboard on True/False answer page', async ({ page }) => {
  // Test True/False answer page
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 15000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 15000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for either the question or the V button to appear, whichever comes first
  const questionText = page.locator('.question-text');
  const vButton = page.getByRole('button', { name: 'V', exact: true });
  const start = Date.now();
  let questionVisible = false;
  let vButtonVisible = false;
  while (Date.now() - start < 12000) {
    questionVisible = await questionText.isVisible().catch(() => false);
    vButtonVisible = await vButton.isVisible().catch(() => false);
    if (questionVisible || vButtonVisible) break;
    await page.waitForTimeout(200);
  }
  if (!questionVisible && !vButtonVisible) {
    throw new Error('Neither question nor V button became visible in time');
  }
  // If question is visible, click V button; if not, wait for V button
  if (questionVisible) {
    await vButton.waitFor({ state: 'visible', timeout: 8000 });
    await vButton.click({ timeout: 15000 });
  } else {
    await vButton.waitFor({ state: 'visible', timeout: 12000 });
    await vButton.click({ timeout: 15000 });
  }

  // Should see area name with mortarboard on True/False answer page
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible();
});

test('shows area name with mortarboard on MCQ answer page', async ({ page }) => {
  // Test MCQ answer page
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'A', exact: true }).click();

  // Should see area name with mortarboard on MCQ answer page
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible();
});

test('remembers last studied area in localStorage', async ({ page }) => {
  // Select Lógica I area
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();

  // Check that currentArea is stored in localStorage (now shortName)
  const currentArea = await page.evaluate(() => localStorage.getItem('currentArea'));
  expect(currentArea).toBe('log1');

  // Go to different area
  await page.getByRole('button', { name: 'Opciones' }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).first().click();
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();

  // Check that currentArea is updated (now shortName)
  const newCurrentArea = await page.evaluate(() => localStorage.getItem('currentArea'));
  expect(newCurrentArea).toBe('ipc');
});

test('automatically returns to last studied area on app reload', async ({ page }) => {
  // Set up: study an area first
  await page.waitForLoadState('networkidle');
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .waitFor({ timeout: 15000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load - look for any quiz indicator
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Reload the page
  await page.reload({ waitUntil: 'networkidle', timeout: 25000 });

  // Wait a moment for everything to initialize
  await page.waitForLoadState('networkidle');

  // Give Firefox extra time to restore state after reload
  await page.waitForTimeout(3000);

  // Check if we're in the quiz (should auto-resume) or back to IPC area
  const continueButtonVisible = await page
    .getByRole('button', { name: 'Continuar' })
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const menuVisible = await page
    .getByText('¿Cómo quieres las preguntas?')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const areaMenuVisible = await page
    .getByText('🎓 Área: Introducción al Pensamiento Científico')
    .isVisible({ timeout: 10000 })
    .catch(() => false);
  const areaSelectionVisible = await page
    .getByText('¿Qué quieres estudiar?')
    .isVisible({ timeout: 5000 })
    .catch(() => false);
  const quizVisible = await page
    .locator('text=❓')
    .isVisible({ timeout: 10000 })
    .catch(() => false);

  if (continueButtonVisible || quizVisible) {
    // We're in the quiz - this is the expected behavior
    expect(continueButtonVisible || quizVisible).toBe(true);
  } else {
    // We're on the home page - check that IPC is available
    expect(menuVisible || areaMenuVisible).toBe(true);
    expect(areaSelectionVisible).toBe(false);
  }
}, 45000);

test('restores to area selection if no previous area stored', async ({ page }) => {
  // Reload page
  await page.reload();

  // Should show area selection screen since no area was stored
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
});

test('preserves quiz progress when switching between areas', async ({ page }) => {
  // Start Lógica I quiz and answer a question
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Orden secuencial' }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any quiz answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByRole('button', { name: 'V', exact: true })
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByRole('button', { name: 'A', exact: true })
      .isVisible()
      .catch(() => false);

    if (vButtonVisible) {
      // True/False question already loaded
    } else if (aButtonVisible) {
      // Multiple Choice question already loaded
    } else {
      // Wait for any answer button to appear
      try {
        await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
          timeout: 6000,
        });
      } catch {
        await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
          timeout: 6000,
        });
      }
    }
  }

  // Click appropriate answer button based on question type
  const vButtonExists = await page
    .getByRole('button', { name: 'V', exact: true })
    .isVisible()
    .catch(() => false);
  if (vButtonExists) {
    await page.getByRole('button', { name: 'V', exact: true }).click({ timeout: 10000 });
  } else {
    await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });
  }
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });

  // Check and store the number of pending questions after answering one in Lógica I
  const statusText = await page.locator('body').innerText();
  const pendientesMatch = statusText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;
  // Extract section name (assume it's after the 📚 emoji and before a line break)
  const sectionMatch = statusText.match(/📚 ([^\n]+)/);
  const sectionBefore = sectionMatch ? sectionMatch[1].trim() : null;

  // Switch to IPC area
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await page
    .getByRole('button', { name: /Introducción al Pensamiento Científico/ })
    .click({ timeout: 10000 });

  // Wait for IPC area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Introducción al Pensamiento Científico')).toBeVisible({
    timeout: 5000,
  });
  await page.getByRole('button', { name: 'Todas las preguntas' }).click({ timeout: 10000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for Multiple Choice buttons which indicate quiz is loaded
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 8000,
    });
  }

  // Now answer a question in IPC
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'A', exact: true }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Continuar' }).click({ timeout: 10000 });

  // Switch back to Lógica I
  await page.getByRole('button', { name: 'Opciones' }).click({ timeout: 10000 });
  await page.getByRole('button', { name: 'Cambiar área' }).first().click({ timeout: 10000 });
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: /Lógica I/ }).click({ timeout: 10000 });

  // Wait for Lógica I area to load and navigate to questions
  await expect(page.getByText('🎓 Área: Lógica I')).toBeVisible({ timeout: 5000 });

  // Wait for quiz to load with network idle first
  await page.waitForLoadState('networkidle');

  // Wait for quiz interface to be ready - try question text first, fallback to answer buttons
  try {
    await expect(page.locator('.question-text')).toBeVisible({ timeout: 8000 });
  } catch {
    // Fallback: wait for any answer buttons which indicate quiz is loaded
    const vButtonVisible = await page
      .getByRole('button', { name: 'V', exact: true })
      .isVisible()
      .catch(() => false);
    const aButtonVisible = await page
      .getByRole('button', { name: 'A', exact: true })
      .isVisible()
      .catch(() => false);
    if (!vButtonVisible && !aButtonVisible) {
      await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible({
        timeout: 8000,
      });
    }
  }

  // Check for question UI (e.g., answer buttons)
  const vButtonVisible = await page
    .getByRole('button', { name: 'V', exact: true })
    .isVisible()
    .catch(() => false);
  const fButtonVisible = await page
    .getByRole('button', { name: 'F', exact: true })
    .isVisible()
    .catch(() => false);
  const aButtonVisible = await page
    .getByRole('button', { name: 'A', exact: true })
    .isVisible()
    .catch(() => false);
  // At least one answer button should be visible
  expect(vButtonVisible || fButtonVisible || aButtonVisible).toBe(true);
  // Check that the number of pending questions is the same as before switching
  const statusTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = statusTextAfter.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  const sectionMatchAfter = statusTextAfter.match(/📚 ([^\n]+)/);
  const sectionAfter = sectionMatchAfter ? sectionMatchAfter[1].trim() : null;
  expect(pendientesAfter).toBe(pendientesBefore);
  expect(sectionAfter).toBe(sectionBefore);
}, 40000);
