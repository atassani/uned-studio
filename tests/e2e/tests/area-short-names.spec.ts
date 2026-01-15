import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
});

test('Area selection shows short names prominently and full names below', async ({ page }) => {
  // Short names (e.g., LOG1, IPC) should be visible and prominent
  await expect(page.getByText('LOG1', { exact: true })).toBeVisible();
  await expect(page.getByText('IPC', { exact: true })).toBeVisible();
  // Full names should be visible in smaller font below
  await expect(page.getByText('Lógica I', { exact: true })).toBeVisible();
  await expect(page.getByText('Introducción al Pensamiento Científico', { exact: true })).toBeVisible();
  // Short name should be visually more prominent than full name (font size or weight)
  // (This is a visual assertion, but we can check DOM structure)
  const log1Short = await page.locator('text=LOG1').first();
  const log1Full = await page.locator('text=Lógica I').first();
  const log1ShortFont = await log1Short.evaluate(node => window.getComputedStyle(node).fontSize);
  const log1FullFont = await log1Full.evaluate(node => window.getComputedStyle(node).fontSize);
  expect(parseFloat(log1ShortFont)).toBeGreaterThan(parseFloat(log1FullFont));
});
