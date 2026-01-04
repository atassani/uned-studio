import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

test('home page loads and shows heading', async ({ page }) => {
  await page.goto('/');

  // Example: assert an h1 is visible
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});

test('can navigate / interact', async ({ page }) => {
  await page.goto('/');

  // Example: click a button by accessible name
  //await page.getByRole('button', { name: /login/i }).click();

  // Example: expect a form field to appear
  //await expect(page.getByLabel(/email/i)).toBeVisible();
});

test('test', async ({ page }) => {
  await page.goto(homePath);

  // Check version is on the front page
  await expect(page.getByRole('link', { name: 'Historial de versiones' })).toBeVisible();

  // Can go to the version history and back
  await page.getByRole('link', { name: 'Historial de versiones' }).click();
  await page.getByRole('link', { name: 'Volver al menú' }).click();

  // In the Seleccionar secciones, select a section and start the quiz
  await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
  // Cannot find Historial de versiones in this page
  await expect(page.getByRole('link', { name: 'Historial de versiones' })).toHaveCount(0);

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
