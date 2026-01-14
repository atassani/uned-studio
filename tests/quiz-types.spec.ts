import { test, expect } from '@playwright/test';

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || '').replace(/\/$/, '');
const homePath = basePath ? `${basePath}/` : '/';

test('True/False quiz works for Lógica I area', async ({ page }) => {
  await page.goto(homePath);
  await page.getByRole('button', { name: /Lógica I/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await expect(page.getByRole('button', { name: 'V', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'F', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'V', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});

test('Multiple Choice quiz shows question text with A/B/C buttons (consistent with True/False)', async ({ page }) => {
  await page.goto(homePath);
  await page.getByRole('button', { name: /Introducción al Pensamiento Científico/ }).click();
  await page.getByRole('button', { name: 'Todas las preguntas' }).click();
  await expect(page.getByRole('button', { name: 'A', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'B', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'C', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'A', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText(/📊\s*\d+\s*\|\s*✅\s*\d+/)).toBeVisible();
});
