import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

test('shows area selection screen first', async ({ page }) => {
  await page.goto(homePath);
  
  // Should see area selection screen
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  
  // Should have area buttons
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Introducción al Pensamiento Científico/ })).toBeVisible();
});

test('can select an area and proceed to question selection', async ({ page }) => {
  await page.goto(homePath);
  
  // Click on Lógica I area
  await page.getByRole('button', { name: /Lógica I/ }).click();
  
  // Should see question selection screen for Lógica I
  await expect(page.getByText('¿Cómo quieres las preguntas de Lógica I?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas las preguntas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seleccionar secciones' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seleccionar preguntas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cambiar área' })).toBeVisible();
});

test('can go back to area selection from question selection', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).click();
  
  // Should be back at area selection
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  
  // Should see True/False question interface
  await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'F', exact: true })).toBeVisible();
  
  // Answer a question
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('Multiple Choice quiz shows question text with A/B/C buttons (consistent with True/False)', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  
  // Should see question text (not as buttons)
  await expect(page.locator('.question-text')).toBeVisible();
  
  // Should see A/B/C buttons at the bottom (not full option text as buttons)
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible();
  
  // Should NOT see buttons with full option text
  await expect(page.getByRole('button', { name: /No es objetivo porque hay personas/ })).not.toBeVisible();
});

test('shows area name in question view', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  
  // Should show area name at top
  await expect(page.getByText('Lógica I')).toBeVisible();
});

test('shows area name in status view ("Ver Estado")', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await page.getByRole('button', { name: 'Ver estado' }).click();
  
  // Should show area name at top of status view
  await expect(page.getByText('Lógica I')).toBeVisible();
});

test('shows area name in question selection menu', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Lógica I/ }).click();
  
  // Should show area name in the question selection menu
  await expect(page.getByText('Lógica I')).toBeVisible();
});

test('migrates old quizStatus to area-specific storage without .json suffix', async ({ page }) => {
  // Set up old localStorage data
  await page.goto(homePath);
  await page.evaluate(() => {
    localStorage.setItem('quizStatus', '{"0": "correct", "1": "fail"}');
  });
  
  // Reload page to trigger migration
  await page.reload();
  
  // Wait for areas to load (which triggers migration)
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
  
  // Check that data was migrated and old data removed
  const newData = await page.evaluate(() => localStorage.getItem('quizStatus_questions_logica1'));
  const oldData = await page.evaluate(() => localStorage.getItem('quizStatus'));
  
  expect(newData).toBe('{"0": "correct", "1": "fail"}');
  expect(oldData).toBeNull();
});

test('Multiple Choice quiz works for IPC area', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  
  // Should see Multiple Choice question interface with options
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible();
  
  // Answer a question
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('keyboard shortcuts work for area selection', async ({ page }) => {
  await page.goto(homePath);
  
  // Wait for areas to load
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
  
  // Press '1' to select first area
  await page.keyboard.press('1');
  
  // Should be in question selection for first area
  await expect(page.getByText(/¿Cómo quieres las preguntas de/)).toBeVisible();
});

test('keyboard shortcuts work for Multiple Choice questions', async ({ page }) => {
  await page.goto(homePath);
  
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  
  // Press 'a' to answer with option A
  await page.keyboard.press('a');
  await expect(page.getByRole('button', { name: 'Continuar' })).toBeVisible();
});

test('version link works from area selection but not from other screens', async ({ page }) => {
  await page.goto(homePath);

  await expect(page.getByRole('link', { name: 'Historial de versiones' })).toBeVisible();

  await page.getByRole('link', { name: 'Historial de versiones' }).click();
  await page.getByRole('link', { name: 'Volver al menú' }).click();

  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
  await expect(page.getByRole('link', { name: 'Historial de versiones' })).toHaveCount(0);
});

test('selects one section and starts quiz in Lógica I area', async ({ page }) => {
  await page.goto(homePath);

  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
  await page.getByRole('checkbox', { name: 'CUESTIONES DE LOS APUNTES' }).check();
  await page.getByRole('button', { name: 'Empezar' }).click();
  await page.getByText('📊 Total: 55 | Correctas: 0').click();
  await expect(page.locator('body')).toContainText('📊 Total: 55 | Correctas: 0 | Falladas: 0 | Pendientes: 55');

  await page.getByRole('button', { name: 'Ver estado' }).click();
  await page.getByText('📚 CUESTIONES DE LOS APUNTES1').click();
  await expect(page.locator('body')).toContainText('📚 CUESTIONES DE LOS APUNTES1❓2❓3❓4❓5❓6❓7❓8❓9❓10❓11❓12❓13❓14❓15❓16❓17❓18❓19❓20❓21❓22❓23❓24❓25❓26❓27❓28❓29❓30❓31❓32❓33❓34❓35❓36❓37❓38❓39❓40❓41❓42❓43❓44❓45❓46❓47❓48❓49❓50❓51❓52❓53❓54❓55❓');

  await page.getByRole('button', { name: 'Continuar' }).click();
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
});
