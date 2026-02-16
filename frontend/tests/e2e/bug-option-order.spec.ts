import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, waitForQuizReady } from './helpers';

test.describe('bug-006: options are always in the same order, even with shuffle enabled', () => {
  test('options appear in different order when restarting a quiz', async ({ page }) => {
    await setupFreshTestAuthenticated(page);
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('answer-order-random-button').click();
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);

    const options: string[][] = [];

    for (let attempt = 0; attempt < 5; attempt++) {
      const questionElement = await page.locator('.question-options').first();
      const questionText = await questionElement.innerText();
      const matchA = questionText.match(/^A\) (.+)/m);
      const matchB = questionText.match(/^B\) (.+)/m);
      const matchC = questionText.match(/^C\) (.+)/m);
      const optionsForThisAttempt: string[] = [
        matchA ? matchA[1] : 'UNKNOWN',
        matchB ? matchB[1] : 'UNKNOWN',
        matchC ? matchC[1] : 'UNKNOWN',
      ];
      options.push(optionsForThisAttempt);
      await page.getByTestId('options-button').click();
      await page.getByTestId('reset-quiz-button').first().click();
      await page.getByTestId('quiz-all-button').click();
      await waitForQuizReady(page);
    }

    // all attempts have the same options (sorted)
    const sortedOptions = options.map((arr) => [...arr].sort().join('|'));
    const allSortedEqual = sortedOptions.every((val) => val === sortedOptions[0]);
    expect(allSortedEqual).toBe(true);

    // not all option orders are the same
    const allSame = options.every((order) => JSON.stringify(order) === JSON.stringify(options[0]));
    expect(allSame).toBe(false);
  });

  test('options appear in same order if Secuencial', async ({ page }) => {
    await setupFreshTestAuthenticated(page);
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('answer-order-sequential-button').click();
    await page.getByTestId('quiz-all-button').click();
    await waitForQuizReady(page);

    const options: string[][] = [];

    for (let attempt = 0; attempt < 5; attempt++) {
      const questionElement = await page.locator('.question-options').first();
      const questionText = await questionElement.innerText();
      const matchA = questionText.match(/^A\) (.+)/m);
      const matchB = questionText.match(/^B\) (.+)/m);
      const matchC = questionText.match(/^C\) (.+)/m);
      const optionsForThisAttempt: string[] = [
        matchA ? matchA[1] : 'UNKNOWN',
        matchB ? matchB[1] : 'UNKNOWN',
        matchC ? matchC[1] : 'UNKNOWN',
      ];
      options.push(optionsForThisAttempt);
      await page.getByTestId('options-button').click();
      await page.getByTestId('reset-quiz-button').first().click();
      await page.getByTestId('quiz-all-button').click();
      await waitForQuizReady(page);
    }

    // all attempts have the same options are the same
    const allSame = options.every((order) => JSON.stringify(order) === JSON.stringify(options[0]));
    expect(allSame).toBe(true);
  });
});
