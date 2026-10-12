import { test, expect } from '@playwright/test';
import * as path from 'path';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

test.describe('Stage 3 — Loading Recovery, Error Handling & End-to-End Regression', () => {

  // Skenario 1: Analisis Gagal & Retry
  test('1. Analysis failure recovery: API failure -> AnalysisFailureScreen -> Retry -> Success', async ({ page }) => {
    let analyzeAttempts = 0;

    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-analysis-fail',
          message: 'Ready for analysis'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/analyze', async (route) => {
      analyzeAttempts++;
      if (analyzeAttempts === 1) {
        // Attempt 1: Simulasikan kegagalan analisis (RETRY_REQUIRED)
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'error',
            route: 'RETRY_REQUIRED',
            message: 'Analysis temporarily timed out. Please retry.'
          }),
        });
      } else {
        // Attempt 2: Sukses setelah retry
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'success',
            route: 'SUCCESS',
            analysis: {
              visualSuitability: { isValid: true },
              attributes: {
                faceShape: { value: 'oval', source: 'Observed' },
                hairType: { value: 'straight', source: 'Observed' },
                hairLength: { value: 'short', source: 'Observed' },
                hairThickness: { value: 'medium', source: 'Inferred' },
                hairLine: { value: 'straight', source: 'Observed' }
              }
            },
            message: 'Analysis success'
          }),
        });
      }
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Make It Real' }).click();

    // Check consent & upload foto
    const consent = page.getByLabel(/I agree to photo processing/i);
    if (await consent.count()) await consent.check();
    else {
      const consentText = page.getByText(/I agree to photo processing/i);
      if (await consentText.count()) await consentText.click();
    }

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);

    await page.getByRole('button', { name: /^Continue$/i }).click();

    // Verifikasi layar Analysis Failure tampil
    const failureHeading = page.getByRole('heading', { name: 'Analysis failed' });
    await expect(failureHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Analysis temporarily timed out. Please retry.')).toBeVisible();

    const retryBtn = page.getByRole('button', { name: 'Retry Analysis' });
    await expect(retryBtn).toBeVisible();

    // Klik Retry Analysis
    await retryBtn.click();

    // Verifikasi alur sukses dan beralih ke layar 'What we can see'
    const whatWeSeeHeading = page.getByRole('heading', { name: 'What we can see' });
    await expect(whatWeSeeHeading).toBeVisible({ timeout: 15_000 });
    expect(analyzeAttempts).toBe(2);
  });

  // Skenario 2: Preview Gagal & Pemulihan (Continue Without Preview)
  test('2. Preview failure recovery: API failure -> PreviewFailureScreen -> Continue Without Preview -> Barber Brief', async ({ page }) => {
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-preview-fail',
          message: 'Ready'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          analysis: {
            visualSuitability: { isValid: true },
            attributes: {
              faceShape: { value: 'oval', source: 'Observed' },
              hairType: { value: 'wavy', source: 'Observed' }
            }
          },
          message: 'Success'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/recommendations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          recommendations: {
            recommendations: [
              {
                id: 'style-test-1',
                name: 'Tapered Crew Cut',
                description: 'Classic clean taper',
                reason: 'Matches face structure',
                stylingEffort: 'low',
                constraints: [],
                isBestMatch: true,
                bestMatchReason: 'Best match',
                feasibility: 'Ready Now',
                barberBrief: { top: '2 cm', sides: 'Tapered #2' }
              }
            ]
          },
          message: 'Success'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/select', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_PREVIEW',
          selectedHairstyleId: 'style-test-1'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/preview', async (route) => {
      // Simulasikan preview gagal dari backend
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'error',
          route: 'FAILED',
          message: 'Preview simulation model temporarily unavailable'
        }),
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Make It Real' }).click();

    const consent = page.getByLabel(/I agree to photo processing/i);
    if (await consent.count()) await consent.check();
    else {
      const consentText = page.getByText(/I agree to photo processing/i);
      if (await consentText.count()) await consentText.click();
    }

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    await page.getByRole('button', { name: 'See Recommendations' }).click();

    // Pilih rekomendasi
    const selectCutBtn = page.getByRole('button', { name: 'Select This Cut', exact: true });
    await expect(selectCutBtn).toBeVisible({ timeout: 10_000 });
    await selectCutBtn.click();

    // Trigger AI preview
    const previewCta = page.getByRole('button', { name: 'Try This Look — Preview on Me' });
    await expect(previewCta).toBeVisible();
    await previewCta.click();

    // Verifikasi PreviewFailureScreen tampil
    const failureHeading = page.getByRole('heading', { name: 'Preview failed' });
    await expect(failureHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Tapered Crew Cut')).toBeVisible();
    await expect(page.getByText('Preview simulation model temporarily unavailable')).toBeVisible();

    // Klik Continue Without Preview
    const continueWithoutBtn = page.getByRole('button', { name: 'Continue Without Preview' });
    await expect(continueWithoutBtn).toBeVisible();
    await continueWithoutBtn.click();

    // Verifikasi sampai di Barber Brief dengan gaya yang sama
    const briefHeading = page.getByRole('heading', { name: 'Tapered Crew Cut' });
    await expect(briefHeading).toBeVisible();
    await expect(page.getByText('Barber Brief')).toBeVisible();
  });

  // Skenario 3: E2E Full Journey (Upload -> Analysis -> Recommendations -> Preview -> Barber Brief -> Save -> My Haircuts -> Reopen)
  test('3. Full Journey: complete flow from Upload to Save and reopen from My Haircuts', async ({ page }) => {
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-full-journey',
          message: 'Ready'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          analysis: {
            visualSuitability: { isValid: true },
            attributes: {
              faceShape: { value: 'oval', source: 'Observed' },
              hairType: { value: 'straight', source: 'Observed' }
            }
          },
          message: 'Success'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/recommendations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          recommendations: {
            recommendations: [
              {
                id: 'full-cut-1',
                name: 'Executive Side Part',
                description: 'Refined professional cut',
                reason: 'Flattering proportions',
                stylingEffort: 'medium',
                constraints: ['Light pomade needed'],
                isBestMatch: true,
                bestMatchReason: 'Best match: Ready Now.',
                feasibility: 'Ready Now',
                barberBrief: { top: '3.5 inches', sides: 'Scissor tapered', styling: 'Side comb' }
              }
            ]
          },
          message: 'Success'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/select', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_PREVIEW',
          selectedHairstyleId: 'full-cut-1'
        }),
      });
    });

    await page.route(url => url.pathname === '/api/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          previewImageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          message: 'Success'
        }),
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 1. Upload
    await page.getByRole('button', { name: 'Make It Real' }).click();
    const consent = page.getByLabel(/I agree to photo processing/i);
    if (await consent.count()) await consent.check();
    else {
      const consentText = page.getByText(/I agree to photo processing/i);
      if (await consentText.count()) await consentText.click();
    }
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    // 2. Analysis results -> See Recommendations
    await page.getByRole('button', { name: 'See Recommendations' }).click();

    // 3. Select cut
    const selectCutBtn = page.getByRole('button', { name: 'Select This Cut', exact: true });
    await expect(selectCutBtn).toBeVisible({ timeout: 10_000 });
    await selectCutBtn.click();

    // 4. Preview
    await page.getByRole('button', { name: 'Try This Look — Preview on Me' }).click();

    // 5. Preview screen -> Continue to Brief
    const continueToBriefBtn = page.getByRole('button', { name: /Continue to Brief/i });
    await expect(continueToBriefBtn).toBeVisible({ timeout: 15_000 });
    await continueToBriefBtn.click();

    // 6. Barber Brief -> Save
    await expect(page.getByRole('heading', { name: 'Executive Side Part' })).toBeVisible();
    const saveBriefBtn = page.getByRole('button', { name: /Save This Haircut|Save/i }).first();
    await expect(saveBriefBtn).toBeVisible();
    await saveBriefBtn.click();

    // 7. Save Haircut screen -> Click Save
    await expect(page.getByRole('heading', { name: 'Save Haircut' })).toBeVisible();
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // 8. Save success screen -> View My Haircuts
    const viewHaircutsBtn = page.getByRole('button', { name: 'View My Haircuts' });
    await expect(viewHaircutsBtn).toBeVisible({ timeout: 10_000 });
    await viewHaircutsBtn.click();

    // 9. My Haircuts Screen -> Verify saved haircut exists
    await expect(page.getByRole('heading', { name: 'My Haircuts' })).toBeVisible();
    await expect(page.getByText('Executive Side Part').first()).toBeVisible();

    // 10. Reopen brief from My Haircuts
    const showBarberBtn = page.getByRole('button', { name: 'Show My Barber' }).first();
    await expect(showBarberBtn).toBeVisible();
    await showBarberBtn.click();

    // Verifikasi brief dibuka kembali dengan gaya rambut yang benar
    await expect(page.getByRole('heading', { name: 'Executive Side Part' })).toBeVisible();
    await expect(page.getByText('Barber Brief')).toBeVisible();
  });

  // Skenario 4: Viewport Responsiveness & Zero Horizontal Overflow (360, 375, 390 px)
  const targetViewports = [360, 375, 390];
  for (const width of targetViewports) {
    test(`4. Responsive viewport check at ${width}px (No horizontal overflow)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('/');

      const dimensions = await page.evaluate(() => ({
        viewportWidth: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
      }));

      expect(
        dimensions.documentWidth,
        `Horizontal overflow detected on Homepage at ${width}px`
      ).toBeLessThanOrEqual(dimensions.viewportWidth);
    });
  }
});
