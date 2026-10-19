import { test, expect } from '@playwright/test';

// Signed-out users must never reach authed pages: every protected route
// redirects to /masuk.
const PROTECTED = ['/dashboard', '/anak', '/jadwal', '/laporan', '/admin', '/peta', '/periksa'];

for (const path of PROTECTED) {
  test(`${path} redirects signed-out users to /masuk`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/masuk$/, { timeout: 20_000 });
  });
}
