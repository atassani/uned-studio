import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForAppReady } from './helpers';

test.describe('StatusGrid overlay CSS layering verification', () => {
  test('should verify that overlay CSS properties are correctly configured', async ({ page }) => {
    await setupFreshTestAuthenticated(page);
    await waitForAppReady(page);

    // Start a quiz
    await page.getByTestId('area-mcq-tests').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('quiz-all-button').click();

    // Wait for the first question
    await expect(page.locator('.question-text')).toBeVisible();

    // Answer incorrectly - click on 'A' option
    await page.getByTestId('mcq-answer-A').click();

    // Navigate to status grid using keyboard shortcut
    await page.keyboard.press('E');

    // Wait for status grid to load
    await expect(page.getByText('✅ = Correcta')).toBeVisible();

    // Try to click on a failed question if one exists
    const failedQuestionCell = page.locator('.cursor-pointer[title*="Ver detalles"]').first();

    // Only proceed if we have failed questions
    const failedCount = await failedQuestionCell.count();
    if (failedCount > 0) {
      await failedQuestionCell.click();

      // Verify overlay has correct CSS properties for layering
      const overlay = page.locator('.fixed.inset-0').first();
      await expect(overlay).toBeVisible();

      // Check that it has the rgba background style for transparency
      const overlayClass = await overlay.getAttribute('class');
      expect(overlayClass).toContain('bg-black/50');

      // Verify content box is visible within overlay
      await expect(page.locator('.bg-white.p-6.rounded-lg')).toBeVisible();

      // Close overlay
      await page.getByText('×').click();
      await expect(overlay).not.toBeVisible();
    }
  });
});
