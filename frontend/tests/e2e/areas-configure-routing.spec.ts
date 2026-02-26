import { test, expect } from '@playwright/test';
import {
  setupFreshTestAuthenticated,
  ensureAreaSelectionVisible,
  openSelectionMenuByTestId,
} from './helpers';

test('single click on Configurar opens configure view and URL', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await page.getByTestId('configure-areas-button').click();

  await expect(page.getByTestId('area-configuration-view')).toBeVisible();
  await expect(page).toHaveURL(/\/studio\/areas\/configure\/?$/);
});

test('starting quiz from area menu navigates to /quiz', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await page.getByTestId('area-log1').click();
  await expect(page.getByTestId('selection-menu')).toBeVisible();
  await page.getByTestId('quiz-all-button').click();

  await expect(page).toHaveURL(/\/studio\/quiz\/?$/);
});

test('selecting sections from menu navigates to /quiz/sections', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await openSelectionMenuByTestId(page, 'log1');
  await page.getByTestId('quiz-sections-button').click({ force: true });

  await expect(page).toHaveURL(/\/studio\/quiz\/sections\/?$/);
  await expect(page.getByText('Selecciona las secciones')).toBeVisible();
});

test('selecting questions from menu navigates to /quiz/questions', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await openSelectionMenuByTestId(page, 'log1');
  await page.getByTestId('quiz-questions-button').click({ force: true });

  await expect(page).toHaveURL(/\/studio\/quiz\/questions\/?$/);
  await expect(page.getByText('Selecciona las preguntas')).toBeVisible();
});

test('opening options from quiz navigates to /quiz/status', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await page.getByTestId('area-log1').click();
  await expect(page.getByTestId('selection-menu')).toBeVisible();
  await page.getByTestId('quiz-all-button').click();
  await expect(page.getByTestId('question-view')).toBeVisible();

  await page.getByTestId('options-button').click();

  await expect(page).toHaveURL(/\/studio\/quiz\/status\/?$/);
});

test('status change area keeps user on /areas and does not rebound to quiz', async ({ page }) => {
  await setupFreshTestAuthenticated(page);
  await ensureAreaSelectionVisible(page);

  await openSelectionMenuByTestId(page, 'log1');
  await page.getByTestId('quiz-all-button').click();
  await expect(page.getByTestId('question-view')).toBeVisible();

  await page.getByTestId('options-button').click();
  await page.getByTestId('change-area-button').first().waitFor({ timeout: 10000 });
  await page.getByTestId('change-area-button').first().click({ force: true });

  await expect(page).toHaveURL(/\/studio\/areas\/?$/);
  await expect(page.getByTestId('area-log1')).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page).toHaveURL(/\/studio\/areas\/?$/);
});
