import { test, expect } from '@playwright/test';
import { setupFreshTest, waitForAppReady } from './helpers';

test.describe('StatusGrid overlay CSS layering verification', () => {
  test('should verify that overlay CSS properties are correctly configured', async ({ page }) => {
    await setupFreshTest(page);
    await waitForAppReady(page);

    // Start a quiz
    await page.getByRole('button', { name: /MCQ/i }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: /todas las preguntas/i }).click();

    // Wait for the first question
    await expect(page.locator('.question-text')).toBeVisible();

    // Answer incorrectly - click on 'A' option
    await page.getByText('A)').click();

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
      const overlayStyle = await overlay.getAttribute('style');
      expect(overlayStyle).toContain('rgba(0, 0, 0, 0.5)');

      // Verify content box is visible within overlay
      await expect(page.locator('.bg-white.p-6.rounded-lg')).toBeVisible();

      // Close overlay
      await page.getByText('×').click();
      await expect(overlay).not.toBeVisible();
    }
  });
});
