import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, ensureAreaSelectionVisible } from './helpers';

test('single click on Configurar opens configure view and URL', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await page.getByTestId('configure-areas-button').click();

  await expect(page.getByTestId('area-configuration-view')).toBeVisible();
  await expect(page).toHaveURL(/\/studio\/areas\/configure\/?$/);
});

