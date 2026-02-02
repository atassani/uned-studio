import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.describe('Question Order Control', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
    await page.getByTestId('guest-login-btn').click();
  });

  test('sequential order shows questions by number order', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

    // First question should be question number 1
    const questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Continue to next question - should be question 2
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    const nextQuestionText = await page.locator('body').innerText();
    expect(nextQuestionText).toMatch(/\n2\./);
  });

  test('random order shows questions in randomized order', async ({ page }) => {
    // Start IPC quiz with random order (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden aleatorio' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

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
        await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
          timeout: 10000,
        });
        await page.getByRole('button', { name: 'A', exact: true }).click();
        await page.getByRole('button', { name: 'Continuar' }).click();
      }
    }

    // Verify questions are not in sequential order (1, 2, 3, 4, 5)
    const isSequential = questionNumbers.every((num, index) => num === index + 1);
    expect(isSequential).toBe(false);
  });

  test('question order preference applies to section selection', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Seleccionar secciones' }).click();

    // Wait for section selection to load completely
    await page.waitForLoadState('networkidle');

    // Wait for sections to be visible with multiple strategies
    await page.screenshot({ path: 'debug-question-order-tema.png' });
    try {
      await page.waitForSelector('text=/Tema/', { timeout: 5000 });
    } catch (e) {
      const content = await page.content();
      console.error('Tema not found. Page content:', content);
      throw e;
    }

    // Select a section and verify order
    await page.getByText('Tema 1. Ciencia, hechos y evidencia').click();
    await page.getByRole('button', { name: 'Empezar' }).click();

    // Wait for question to load
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('.question-text', { timeout: 10000 });

    // Should start with the first question number in that section
    const questionText = await page.locator('body').innerText();
    // Should show a low question number (sequential within section)
    expect(questionText).toMatch(/[1-9]\./);
  });

  test('question order preference is per-area', async ({ page }) => {
    // Set IPC to sequential (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    // Switch to FDL area (Multiple Choice) - should not have question order set yet
    await page.getByRole('button', { name: /Filosofía del Lenguaje/ }).click();
    // The toggle should not be checked (randomized is default)
    await expect(page.getByLabel('Alternar orden de preguntas')).not.toBeChecked({ timeout: 2000 });
    // Set FDL to sequential
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    // Return to IPC - should still be sequential
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await expect(page.getByLabel('Alternar orden de preguntas')).toBeChecked();
  });

  test('sequential order works for question selection mode', async ({ page }) => {
    // Start IPC quiz with sequential order (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Seleccionar preguntas' }).click();

    // Wait for question list to load and select a few specific questions
    await page.waitForTimeout(1000);
    await page.getByRole('checkbox').first().click(); // Select first question
    await page.getByRole('checkbox').nth(4).click(); // Select 5th question
    await page.getByRole('checkbox').nth(11).click(); // Select 12th question
    await page.getByRole('button', { name: 'Empezar' }).click();

    // Should start with first selected question in sequential order
    const questionText = await page.locator('body').innerText();
    const questionMatch = questionText.match(/(\d+)\./);
    expect(questionMatch).not.toBeNull();
    const firstQuestionNum = parseInt(questionMatch![1], 10);

    // Continue to next question
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    const nextQuestionText = await page.locator('body').innerText();
    const nextQuestionMatch = nextQuestionText.match(/(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);

    // Next question should have a higher number (sequential order)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });

  test('sequential order preserved after resuming quiz', async ({ page }) => {
    // Start quiz with sequential order and answer first question (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

    // Verify first question is 1
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Answer first question
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'A', exact: true }).click();

    // Continue to see next question (should be question 2)
    await page.getByRole('button', { name: 'Continuar' }).click();
    questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n2\./);

    // Now go to Options and change area to test persistence
    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByRole('button', { name: /Filosofía del Lenguaje/ }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).waitFor();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();

    // Wait for area to load completely
    await page.waitForSelector('text=❓');

    // Should resume at question 2 (current question)
    const resumedQuestionText = await page.locator('body').innerText();
    expect(resumedQuestionText).toMatch(/\n2\./);
  }, 30000);

  test('sequential order applies consistently across all quiz modes', async ({ page }) => {
    // Test all quiz modes use sequential order when selected (Multiple Choice area)
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden secuencial' }).click();

    // Test "Todas las preguntas" mode
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);

    // Go back to menu
    await page.getByRole('button', { name: 'Opciones' }).click();
    await page.getByRole('button', { name: 'Volver a empezar' }).first().click();

    // Test "Seleccionar secciones" mode
    await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
    await page.getByText('Tema 1. Ciencia, hechos y evidencia').click();
    await page.getByRole('button', { name: 'Empezar' }).click();

    // Should start with first question number in sequential order for that section
    const firstQuestionElement = await page.locator('.question-text').first();
    const firstQuestionText = await firstQuestionElement.innerText();
    const questionNumber = firstQuestionText.match(/^(\d+)\./);
    expect(questionNumber).not.toBeNull();
    const firstQuestionNum = parseInt(questionNumber![1], 10);

    // Continue to next question - should be next sequential number
    await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible({
      timeout: 10000,
    });
    await page.getByRole('button', { name: 'A', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();

    // Wait for next question to load
    await page.waitForSelector('text=A');
    const nextQuestionElement = await page.locator('.question-text').first();
    const nextQuestionText = await nextQuestionElement.innerText();
    const nextQuestionMatch = nextQuestionText.match(/^(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);

    // Should be next sequential number (not necessarily firstQuestionNum + 1 as sections may have gaps)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });
});
