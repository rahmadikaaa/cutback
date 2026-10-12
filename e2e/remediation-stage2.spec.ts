import { test, expect } from '@playwright/test';
import * as path from 'path';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

// Automated state and synchronization tests for Stage 2 Remediation (REC-01 & REC-02)
test.describe('Hair Recommendations Logic & Synchronization (Stage 2 Remediation)', () => {
  test('mocked recommendations flow: verify choice synchronization and continue journey', async ({ page }) => {
    // Intercept backend API to mock non-live AI responses
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-123',
          message: 'Ready for analysis'
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
              hairType: { value: 'wavy', source: 'Observed' },
              hairLength: { value: 'medium', source: 'Observed' },
              hairThickness: { value: 'medium', source: 'Inferred' },
              hairLine: { value: 'straight', source: 'Observed' }
            }
          },
          message: 'Analysis success'
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
                id: 'mock-rec-0',
                name: 'Classic Side Part',
                description: 'Timeless structured part',
                reason: 'Balances oval face',
                stylingEffort: 'medium',
                constraints: ['Trim every 4 weeks'],
                isBestMatch: true,
                bestMatchReason: 'Best match selected based on feasibility: Ready Now.',
                feasibility: 'Ready Now',
                barberBrief: { top: '3 inches', sides: 'Tapered' }
              },
              {
                id: 'mock-rec-1',
                name: 'Modern Textured Crop',
                description: 'Short textured top with clean fade',
                reason: 'Works with wavy pattern',
                stylingEffort: 'low',
                constraints: ['Low fade maintenance'],
                isBestMatch: false,
                feasibility: 'Ready Now',
                barberBrief: { top: '2 inches', sides: 'Low fade' }
              },
              {
                id: 'mock-rec-2',
                name: 'Long Flow Surfer',
                description: 'Relaxed length and flow',
                reason: 'Requires grow-out',
                stylingEffort: 'low',
                constraints: ['6 months grow out needed'],
                isBestMatch: false,
                feasibility: 'Transition Required',
                transitionGuidance: 'Wait 6 months for length',
                barberBrief: { top: '6 inches', sides: 'Natural flow' }
              }
            ]
          },
          message: 'Recommendations ready'
        }),
      });
    });

    let selectedStyleIdSent: string | null = null;
    await page.route(url => url.pathname === '/api/select', async (route) => {
      const data = route.request().postDataJSON();
      selectedStyleIdSent = data.hairstyleId;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_PREVIEW',
          selectedHairstyleId: data.hairstyleId
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
          message: 'Preview generated'
        }),
      });
    });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // 1. Start journey
    const startBtn = page.getByRole('button', { name: 'Make It Real' });
    await expect(startBtn).toBeVisible();
    await startBtn.click();

    // 2. Upload screen - check consent and continue
    const consent = page.getByLabel(/I agree to photo processing/i);
    if (await consent.count()) await consent.check();
    else {
      const consentText = page.getByText(/I agree to photo processing/i);
      if (await consentText.count()) await consentText.click();
    }

    // Attach valid local test photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);

    const continueUploadBtn = page.getByRole('button', { name: /^Continue$/i });
    await expect(continueUploadBtn).toBeEnabled();
    await continueUploadBtn.click();

    // 3. What we can see screen -> Click See Recommendations directly
    const seeRecsBtn = page.getByRole('button', { name: 'See Recommendations' });
    await expect(seeRecsBtn).toBeVisible({ timeout: 15_000 });
    await seeRecsBtn.click();

    // 4. Recommendation Screen is loaded
    await expect(page.getByText('1 / 3')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Classic Side Part')).toBeVisible();

    // Select cut 1 using the bottom selector button (exact: true)
    const selectCutBtn = page.getByRole('button', { name: 'Select This Cut', exact: true });
    await expect(selectCutBtn).toBeVisible();
    await selectCutBtn.click();
    await expect(page.getByRole('button', { name: '✓ Selected' })).toBeVisible();

    // Now navigate to cut 2 (Next arrow)
    const nextBtn = page.getByLabel('Next recommendation');
    await nextBtn.click();
    await expect(page.getByText('2 / 3')).toBeVisible();
    await expect(page.getByText('Modern Textured Crop')).toBeVisible();

    // At cut 2, the lower button should still say "Select This Cut" (NOT selected for cut 2)
    await expect(page.getByRole('button', { name: 'Select This Cut', exact: true })).toBeVisible();

    // Press "Select This Cut for Journey" button on Transformation Card while viewing cut 2
    // It should now select cut 2 explicitly, NOT jump to preview of cut 1!
    const journeyBtn = page.getByRole('button', { name: /Select This Cut for Journey/i });
    await expect(journeyBtn).toBeVisible();
    await journeyBtn.click();

    // Cut 2 should now become selected
    await expect(page.getByRole('button', { name: '✓ Selected' })).toBeVisible();

    // Click CTA preview
    const previewCta = page.getByRole('button', { name: 'Try This Look — Preview on Me' });
    await expect(previewCta).toBeVisible();
    await previewCta.click();

    // Verify preview API was called with cut 2 (mock-rec-1), NOT cut 1 (mock-rec-0)!
    await expect.poll(() => selectedStyleIdSent).toBe('mock-rec-1');
  });
});
