import { test, expect } from '@playwright/test';

test('landing page renders hero and entry links', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Timbang hari ini');
  await expect(page.getByRole('link', { name: /masuk|mulai/i }).first()).toBeVisible();
});

test('login page renders the form', async ({ page }) => {
  await page.goto('/masuk');
  await expect(page.getByRole('heading', { name: 'Masuk' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Kata sandi' })).toBeVisible();
});

test('public info pages render', async ({ page }) => {
  for (const path of ['/daftar', '/lupa', '/metode', '/privasi', '/panduan']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  }
});

test('wrong password shows an error, not a crash', async ({ page }) => {
  await page.goto('/masuk');
  await page.getByRole('textbox', { name: 'Email' }).fill('no-such-user-zzz@sindaparka.test');
  await page.getByRole('textbox', { name: 'Kata sandi' }).fill('WrongPass123!');
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('alert')).toBeVisible({ timeout: 20_000 });
});
