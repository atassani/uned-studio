import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.describe('Simple Randomization Test', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
  });

  test('answer shuffling demonstrates the bug', async ({ page }) => {
    // Go to IPC area and enable answer shuffling
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Aleatorio' }).click(); // Enable answer shuffling
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

    // Wait for the quiz to load
    await page.waitForSelector('text=A');

    // Get the first option text (button A) - first attempt
    const firstOptionButton1 = await page.getByRole('button', { name: 'A', exact: true });
    const firstOptionText1 = await firstOptionButton1.innerText();

    // Go back to start a new quiz
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await page.waitForSelector('text=A');

    // Get the first option text (button A) - second attempt
    const firstOptionButton2 = await page.getByRole('button', { name: 'A', exact: true });
    const firstOptionText2 = await firstOptionButton2.innerText();

    console.log('First attempt first option:', firstOptionText1);
    console.log('Second attempt first option:', firstOptionText2);

    // If shuffling works, these should be different
    expect(firstOptionText1).not.toBe(firstOptionText2); // This should fail, showing the bug
  });

  test('question order demonstrates the bug', async ({ page }) => {
    // Go to IPC area and select random order
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Orden aleatorio' }).click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();

    // Wait for the quiz to load
    await page.waitForSelector('.question-text');

    // Get the first question number - first attempt
    const questionElement1 = await page.locator('.question-text').first();
    const questionText1 = await questionElement1.innerText();
    const match1 = questionText1.match(/^(\d+)\./);
    const firstQuestionNum1 = match1 ? parseInt(match1[1], 10) : null;

    // Go back to start a new quiz
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    await page.waitForSelector('.question-text');

    // Get the first question number - second attempt
    const questionElement2 = await page.locator('.question-text').first();
    const questionText2 = await questionElement2.innerText();
    const match2 = questionText2.match(/^(\d+)\./);
    const firstQuestionNum2 = match2 ? parseInt(match2[1], 10) : null;

    console.log('First attempt first question:', firstQuestionNum1);
    console.log('Second attempt first question:', firstQuestionNum2);

    // If randomization works, these should be different
    expect(firstQuestionNum1).not.toBe(firstQuestionNum2); // This should fail, showing the bug
  });
});
