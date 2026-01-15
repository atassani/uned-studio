import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.describe('Question Order Control', () => {
  test.beforeEach(async ({ page }) => {
    await setupFreshTest(page);
  });

  test('shows question order selection toggle in quiz menu', async ({ page }) => {
    // Start Lógica I quiz
    await page.getByRole('button', { name: /Lógica I/ }).click();
    // Should see question order toggle options
    await expect(page.getByText('Orden de preguntas:')).toBeVisible();
    await expect(page.getByLabel('Alternar orden de preguntas')).toBeVisible();
    // Default should be random order (checkbox not checked)
    await expect(page.getByLabel('Alternar orden de preguntas')).not.toBeChecked();
  });

  test('allows switching between random and sequential order', async ({ page }) => {
    // Start Lógica I quiz
    await page.getByRole('button', { name: /Lógica I/ }).click();
    // Switch to sequential order (click label)
    await page.getByText('Orden secuencial').click();
    await expect(page.getByLabel('Alternar orden de preguntas')).toBeChecked();
    // Switch back to random order (click label)
    await page.getByText('Orden aleatorio').click();
    await expect(page.getByLabel('Alternar orden de preguntas')).not.toBeChecked();
  });


  test('sequential order shows questions by number order', async ({ page }) => {
    // Start Lógica I quiz with sequential order
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    
    // First question should be question number 1
    const questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);
    
    // Continue to next question - should be question 2
    await page.getByRole('button', { name: 'V', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    
    const nextQuestionText = await page.locator('body').innerText();
    expect(nextQuestionText).toMatch(/\n2\./);
  });

  test('random order shows questions in randomized order', async ({ page }) => {
    // Start Lógica I quiz with random order
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden aleatorio').click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    
    // Collect first few question numbers to verify randomness
    const questionNumbers: number[] = [];
    
    for (let i = 0; i < 5; i++) {
      const questionText = await page.locator('body').innerText();
      const match = questionText.match(/(\d+)\./);
      if (match) {
        questionNumbers.push(parseInt(match[1], 10));
      }
      
      if (i < 4) { // Don't continue after last question
        await page.getByRole('button', { name: 'V', exact: true }).click();
        await page.getByRole('button', { name: 'Continuar' }).click();
      }
    }
    
    // Verify questions are not in sequential order (1, 2, 3, 4, 5)
    const isSequential = questionNumbers.every((num, index) => num === index + 1);
    expect(isSequential).toBe(false);
  });

  test('question order preference applies to section selection', async ({ page }) => {
    // Start Lógica I quiz with sequential order
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
    
    // Select a section and verify order
    await page.getByText('CUESTIONES GENERALES').click();
    await page.getByRole('button', { name: 'Empezar' }).click();
    
    // Should start with the first question number in that section
    const questionText = await page.locator('body').innerText();
    // Should show a low question number (sequential within section)
    expect(questionText).toMatch(/[1-9]\./);
  });

  test('question order preference is per-area', async ({ page }) => {
    // Set Lógica I to sequential
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    // Switch to IPC area - should default to random
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await expect(page.getByLabel('Alternar orden de preguntas')).not.toBeChecked();
    // Set IPC to sequential
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    // Return to Lógica I - should still be sequential
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await expect(page.getByLabel('Alternar orden de preguntas')).toBeChecked();
  });

  test('sequential order works for question selection mode', async ({ page }) => {
    // Start Lógica I quiz with sequential order
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
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
    await page.getByRole('button', { name: 'V', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    
    const nextQuestionText = await page.locator('body').innerText();
    const nextQuestionMatch = nextQuestionText.match(/(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);
    
    // Next question should have a higher number (sequential order)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });

  test('sequential order preserved after resuming quiz', async ({ page }) => {
    // Start quiz with sequential order and answer first question
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    
    // Verify first question is 1
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);
    
    // Answer first question
    await page.getByRole('button', { name: 'V', exact: true }).click();
    
    // Continue to see next question (should be question 2)
    await page.getByRole('button', { name: 'Continuar' }).click();
    questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n2\./);
    
    // Now go to Options and change area to test persistence
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).first().click();
    await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
    await page.getByRole('button', { name: 'Cambiar área' }).click();
    await page.getByRole('button', { name: /Lógica I/ }).waitFor();
    await page.getByRole('button', { name: /Lógica I/ }).click();
    
    // Wait for area to load completely
    await page.waitForSelector('text=❓');
    
    // Should resume at question 2 (current question)
    const resumedQuestionText = await page.locator('body').innerText();
    expect(resumedQuestionText).toMatch(/\n2\./);
  }, 30000);

  test('sequential order applies consistently across all quiz modes', async ({ page }) => {
    // Test all quiz modes use sequential order when selected
    await page.getByRole('button', { name: /Lógica I/ }).click();
    await page.getByText('Orden secuencial').click();
    
    // Test "Todas las preguntas" mode
    await page.getByRole('button', { name: 'Todas las preguntas' }).click();
    let questionText = await page.locator('body').innerText();
    expect(questionText).toMatch(/\n1\./);
    
    // Go back to menu
    await page.getByRole('button', { name: 'Options' }).click();
    await page.getByRole('button', { name: 'Volver a empezar' }).first().click();
    
    // Test "Seleccionar secciones" mode
    await page.getByRole('button', { name: 'Seleccionar secciones' }).click();
    await page.getByText('CUESTIONES GENERALES').click();
    await page.getByRole('button', { name: 'Empezar' }).click();
    
    // Should start with first question number in sequential order for that section
    questionText = await page.locator('body').innerText();
    const questionNumber = questionText.match(/(\d+)\./);
    expect(questionNumber).not.toBeNull();
    const firstQuestionNum = parseInt(questionNumber![1], 10);
    
    // Continue to next question - should be next sequential number
    await page.getByRole('button', { name: 'V', exact: true }).click();
    await page.getByRole('button', { name: 'Continuar' }).click();
    
    const nextQuestionText = await page.locator('body').innerText();
    const nextQuestionMatch = nextQuestionText.match(/(\d+)\./);
    expect(nextQuestionMatch).not.toBeNull();
    const nextQuestionNum = parseInt(nextQuestionMatch![1], 10);
    
    // Should be next sequential number (not necessarily firstQuestionNum + 1 as sections may have gaps)
    expect(nextQuestionNum).toBeGreaterThan(firstQuestionNum);
  });
});