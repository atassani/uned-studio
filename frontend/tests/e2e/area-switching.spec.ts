import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
});

test('Test area switching preserves progress', async ({ page }) => {
  await page.getByTestId('area-log1').waitFor({ timeout: 15000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  await page.getByTestId('selection-menu').waitFor({ timeout: 20000 });
  await page.getByTestId('quiz-all-button').click({ timeout: 10000 });

  // Wait for quiz to load completely
  await page.waitForLoadState('networkidle');

  // Wait for V button to be available
  await page.getByTestId('tf-answer-true').waitFor({ timeout: 20000 });
  await page.getByTestId('tf-answer-true').click({ timeout: 10000 });
  await page.getByTestId('result-continue-button').waitFor({ timeout: 15000 });
  await page.getByTestId('result-continue-button').click({ timeout: 10000 });

  // Wait for status to update
  await page.waitForSelector('text=❓');
  const pageText = await page.locator('body').innerText();
  const pendientesMatch = pageText.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch).not.toBeNull();
  const pendientesBefore = pendientesMatch ? parseInt(pendientesMatch[1], 10) : null;

  await page.getByTestId('options-button').waitFor({ timeout: 10000 });
  await page.getByTestId('options-button').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().waitFor({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-log1').waitFor({ timeout: 10000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });
  // Wait for the area to load completely
  await page.waitForSelector('text=❓', { timeout: 10000 });
  // Check that progress is preserved
  const pageText2 = await page.locator('body').innerText();
  const pendientesMatch2 = pageText2.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatch2).not.toBeNull();
  const pendientesAfterSwitch = pendientesMatch2 ? parseInt(pendientesMatch2[1], 10) : null;
  expect(pendientesAfterSwitch).toBe(pendientesBefore);
  // Now switch back directly using 'Cambiar área' from the main UI
  await page.getByTestId('options-button').waitFor({ timeout: 10000 });
  await page.getByTestId('options-button').click({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().waitFor({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ timeout: 10000 });
  await page.getByTestId('area-log1').waitFor({ timeout: 10000 });
  await page.getByTestId('area-log1').click({ timeout: 10000 });

  // Wait for status to update again
  await page.waitForSelector('text=❓');
  const pageTextAfter = await page.locator('body').innerText();
  const pendientesMatchAfter = pageTextAfter.match(/\|\s*❓\s*(\d+)/);
  expect(pendientesMatchAfter).not.toBeNull();
  const pendientesAfter = pendientesMatchAfter ? parseInt(pendientesMatchAfter[1], 10) : null;
  expect(pendientesAfter).toBe(pendientesBefore);
}, 40000);
