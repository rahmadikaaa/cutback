import { test, expect } from '@playwright/test';

const viewports = [360, 375, 390];

for (const width of viewports) {
  test(`Cutback homepage responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({
      width,
      height: 844,
    });

    await page.goto('http://localhost:8443');

    // Homepage dan CTA harus tampil
    const makeItReal = page.getByRole('button', {
      name: 'Make It Real',
    });

    const myHaircuts = page.getByRole('button', {
      name: 'My Haircuts',
    });

    await expect(makeItReal).toBeVisible();
    await expect(myHaircuts).toBeVisible();

    // Tidak boleh ada horizontal overflow pada document
    const dimensions = await page.evaluate(() => ({
      viewportWidth: document.documentElement.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));

    expect(
      dimensions.documentWidth,
      `Horizontal overflow at ${width}px`
    ).toBeLessThanOrEqual(dimensions.viewportWidth);

    // Simpan screenshot untuk inspeksi visual
    await page.screenshot({
      path: `test-results/homepage-${width}px.png`,
      fullPage: true,
    });
  });
}