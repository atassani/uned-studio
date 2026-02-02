import { test, expect } from '@playwright/test';
import { setupFreshTest } from './helpers';

test.beforeEach(async ({ page }) => {
  await setupFreshTest(page);
  await page.getByTestId('guest-login-btn').click();
});

test('shows area selection screen first', async ({ page }) => {
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Lógica I/ })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Introducción al Pensamiento Científico/ })
  ).toBeVisible();
});

test('can select an area and proceed to question selection', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await expect(page.getByText('¿Cómo quieres las preguntas?')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas las preguntas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seleccionar secciones' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Seleccionar preguntas' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cambiar área' })).toBeVisible();
});

test('can go back to area selection from question selection', async ({ page }) => {
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Cambiar área' }).click();
  await expect(page.getByText('¿Qué quieres estudiar?')).toBeVisible();
});
