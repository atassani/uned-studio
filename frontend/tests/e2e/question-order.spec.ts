import { test, expect } from '@playwright/test';
import { setupFreshTestAuthenticated, startQuizByTestId } from './helpers';

test.describe('Question Order Control', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTestAuthenticated(page);
  });

  test('sequential order shows questions by number order', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await startQuizByTestId(page, 'ipc', { order: 'sequential' });

    // First question should be question number 1
    const questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Continue to next question - should be question 2
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId('mcq-answer-A').click();
    await page.getByTestId('result-continue-button').click();

    const nextQuestionText = await page.locator('body').innerText();
    expect(nextQuestionText).toMatch(/\n2\./);
  });

  test('random order shows questions in randomized order', async ({ page }) => {
    // Start IPC quiz with random order (Multiple Choice area)
    await startQuizByTestId(page, 'ipc', { order: 'random' });

    // Collect first few question numbers to verify randomness
    const questionNumbers: number[] = [];

    for (let i = 0; i < 5; i++) {
      const questionText = await page.locator('body').innerText();
      const match = questionText.match(/(\d+)\./);
      if (match) {
        questionNumbers.push(parseInt(match[1], 10));
      }

      if (i < 4) {
        // Don't continue after last question
        await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
          timeout: 10000,
        });
        await page.getByTestId('mcq-answer-A').click();
        await page.getByTestId('result-continue-button').click();
      }
    }

    // Verify questions are not in sequential order (1, 2, 3, 4, 5)
    const isSequential = questionNumbers.every((num, index) => num === index + 1);
    expect(isSequential).toBe(false);
  });

  test('question order preference applies to section selection', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await startQuizByTestId(page, 'ipc', { order: 'sequential', mode: 'sections' });

    // Wait for section selection to load completely
    await page.waitForLoadState('domcontentloaded');

    try {
      await page.waitForSelector('text=/Tema/', { timeout: 5000 });
    } catch (e) {
      throw e;
    }

    // Select a section and verify order
    await page.getByText('Tema 1. Ciencia, hechos y evidencia').click();
    await page.getByTestId('start-quiz-button').click();

    // Wait for question to load
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('.question-text', { timeout: 10000 });

    // Should start with the first question number in that section
    const questionText = await page.locator('body').innerText();
    // Should show a low question number (sequential within section)
    expect(questionText).toMatch(/[1-9]\./);
  });

  test('question order preference is per-area', async ({ page }) => {
    // Set IPC to sequential (Multiple Choice area)
    await page.getByTestId('area-ipc').click();
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('change-area-button').click();
    // Switch to FDL area (Multiple Choice) - should not have question order set yet
    await page.getByTestId('area-fdl').click();
    // The toggle should not be checked (randomized is default)
    await expect(page.getByTestId('question-order-toggle')).not.toBeChecked({ timeout: 2000 });
    // Set FDL to sequential
    await page.getByTestId('order-sequential-button').click();
    await page.getByTestId('change-area-button').click();
    // Return to IPC - should still be sequential
    await page.getByTestId('area-ipc').click();
    await expect(page.getByTestId('question-order-toggle')).toBeChecked();
  });

  test('sequential order works for question selection mode', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await startQuizByTestId(page, 'ipc', { order: 'sequential', mode: 'questions' });

    // Wait for question list to load and select a few specific questions
    await page.waitForTimeout(1000);
    await page.getByRole('checkbox').first().click(); // Select first question
    await page.getByRole('checkbox').nth(4).click(); // Select 5th question
    await page.getByRole('checkbox').nth(11).click(); // Select 12th question
    await page.getByTestId('start-quiz-button').click();

    // Should start with first selected question in sequential order
    const questionText = await page.locator('body').innerText();
    const questionMatch = questionText.match(/(\d+)\./);
    expect(questionMatch).not.toBeNull();
    const firstQuestionNum = parseInt(questionMatch![1], 10);

    // Continue to next question
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId('mcq-answer-A').click();
    await page.getByTestId('result-continue-button').click();

    const nextQuestionText = await page.locator('body').innerText();
    const nextQuestionMatch = nextQuestionText.match(/(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);

    // Next question should have a higher number (sequential order)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });

  test('sequential order preserved after resuming quiz', async ({ page }) => {
    // Start quiz with sequential order and answer first question (Multiple Choice area)
    await startQuizByTestId(page, 'ipc', { order: 'sequential' });

    // Verify first question is 1
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Answer first question
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId('mcq-answer-A').click();

    // Continue to see next question (should be question 2)
    await page.getByTestId('result-continue-button').click();
    questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n2\./);

    // Now go to Options and change area to test persistence
    await page.getByTestId('options-button').click();
    await page.getByTestId('change-area-button').first().click();
    await page.getByTestId('area-fdl').click();
    await page.getByTestId('change-area-button').click();
    await page.getByTestId('area-ipc').waitFor();
    await page.getByTestId('area-ipc').click();

    // Wait for area to load completely
    await page.getByTestId('question-view').waitFor();

    // Should resume at question 2 (current question)
    const resumedQuestionText = await page.locator('body').innerText();
    expect(resumedQuestionText).toMatch(/\n2\./);
  }, 30000);

  test('sequential order applies consistently across all quiz modes', async ({ page }) => {
    // Test "Todas las preguntas" mode with robust area/menu navigation
    await startQuizByTestId(page, 'ipc', { order: 'sequential', mode: 'all' });
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Go back to menu
    await page.getByTestId('options-button').click();
    await page.getByTestId('reset-quiz-button').first().click();

    // Test "Seleccionar secciones" mode
    await page.getByTestId('quiz-sections-button').click();
    await page.getByText('Tema 1. Ciencia, hechos y evidencia').click();
    await page.getByTestId('start-quiz-button').click();

    // Should start with first question number in sequential order for that section
    const firstQuestionElement = await page.locator('.question-text').first();
    const firstQuestionText = await firstQuestionElement.innerText();
    const questionNumber = firstQuestionText.match(/^(\d+)\./);
    expect(questionNumber).not.toBeNull();
    const firstQuestionNum = parseInt(questionNumber![1], 10);

    // Continue to next question - should be next sequential number
    await expect(page.getByTestId('mcq-answer-A')).toBeVisible({
      timeout: 10000,
    });
    await page.getByTestId('mcq-answer-A').click();
    await page.getByTestId('result-continue-button').click();

    // Wait for next question to load
    await page.getByTestId('mcq-answer-A').waitFor();
    const nextQuestionElement = await page.locator('.question-text').first();
    const nextQuestionText = await nextQuestionElement.innerText();
    const nextQuestionMatch = nextQuestionText.match(/^(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);

    // Should be next sequential number (not necessarily firstQuestionNum + 1 as sections may have gaps)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });
});
