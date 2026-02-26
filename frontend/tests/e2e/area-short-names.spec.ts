import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, ensureAreaSelectionVisible } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);
});

test('Area selection shows short names prominently and full names below', async ({ page }) => {
  const log1Card = page.getByTestId('area-log1');
  const ipcCard = page.getByTestId('area-ipc');

  await expect(log1Card).toBeVisible();
  await expect(ipcCard).toBeVisible();
  await expect(log1Card.getByText('LOG1', { exact: true })).toBeVisible();
  await expect(ipcCard.getByText('IPC', { exact: true })).toBeVisible();
  await expect(log1Card.getByText('Lógica I', { exact: true })).toBeVisible();
  await expect(
    ipcCard.getByText('Introducción al Pensamiento Científico', { exact: true })
  ).toBeVisible();

  // Short name should be visually more prominent than full name (font size or weight)
  // (This is a visual assertion, checked via card-local DOM structure)
  const log1Short = log1Card.getByText('LOG1', { exact: true });
  const log1Full = log1Card.getByText('Lógica I', { exact: true });
  const log1ShortFont = await log1Short.evaluate((node) => window.getComputedStyle(node).fontSize);
  const log1FullFont = await log1Full.evaluate((node) => window.getComputedStyle(node).fontSize);
  expect(parseFloat(log1ShortFont)).toBeGreaterThan(parseFloat(log1FullFont));
});
