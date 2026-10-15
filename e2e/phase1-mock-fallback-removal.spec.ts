import { test, expect } from '@playwright/test';
import * as path from 'path';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

test.describe('Phase 1: Mock Fallback Removal & Data Integrity Regression Tests', () => {
  test('1. Analysis unavailable: Renders explicit empty state and never shows hardcoded mock observations', async ({ page }) => {
    // Intercept upload to succeed
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-empty-analysis',
          message: 'Ready for analysis',
        }),
      });
    });

    // Intercept analyze to return no attributes
    await page.route(url => url.pathname === '/api/analyze', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          analysis: {
            visualSuitability: { isValid: true },
            // attributes missing
          },
          message: 'Analysis success without attributes',
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Make It Real' }).click();

    await page.getByText(/I agree to photo processing/i).click();
    await page.locator('input[type="file"]').first().setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    // Verify explicit "No Analysis Available" screen
    const noAnalysisHeading = page.getByRole('heading', { name: 'No Analysis Available' });
    await expect(noAnalysisHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Photo analysis data is unavailable for this session.')).toBeVisible();

    // Verify mock observation labels from old ANALYSIS_OBS are NOT displayed
    await expect(page.getByText('Natural wave')).not.toBeVisible();
    await expect(page.getByText('Short-medium')).not.toBeVisible();
    await expect(page.getByText('Moderate')).not.toBeVisible();

    // Verify CTA allows returning to upload a new photo
    const uploadNewBtn = page.getByRole('button', { name: 'Upload New Photo' });
    await expect(uploadNewBtn).toBeVisible();
    await uploadNewBtn.click();

    // Successfully returned to upload screen
    await expect(page.getByRole('heading', { name: 'Your photo' })).toBeVisible();
  });

  test('2. Recommendations unavailable: Renders explicit empty state and never displays mock HAIRSTYLES', async ({ page }) => {
    // Intercept upload to succeed
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-empty-recs',
          message: 'Ready for analysis',
        }),
      });
    });

    // Intercept analyze with valid data
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
              hairType: { value: 'straight', source: 'Observed' },
              hairLength: { value: 'short', source: 'Observed' },
              hairThickness: { value: 'fine', source: 'Observed' },
              hairLine: { value: 'straight', source: 'Observed' },
            },
          },
          message: 'Analysis success',
        }),
      });
    });

    // Intercept recommendations to return empty array
    await page.route(url => url.pathname === '/api/recommendations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'SUCCESS',
          recommendations: {
            recommendations: [],
          },
          message: 'No matching recommendations',
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Make It Real' }).click();

    await page.getByText(/I agree to photo processing/i).click();
    await page.locator('input[type="file"]').first().setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    // In unified flow, recommendations are requested directly
    const seeRecsBtn = page.getByRole('button', { name: 'See Recommendations' });
    if (await seeRecsBtn.isVisible()) {
      await seeRecsBtn.click();
    }

    // Verify explicit "No recommendations found" empty state is displayed
    const noRecsHeading = page.getByRole('heading', { name: 'No recommendations found' });
    await expect(noRecsHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('We could not find matching recommendations for your photo.')).toBeVisible();

    // CRITICAL INTEGRITY CHECK: Verify old mock hairstyles are NOT shown as fallbacks
    await expect(page.getByRole('heading', { name: 'Textured Quiff' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Side Part' })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Low Taper + Volume' })).not.toBeVisible();

    // Verify CTAs
    await expect(page.getByRole('button', { name: 'Get Recommendations' })).toBeVisible();
    const backBtn = page.getByRole('button', { name: 'Back to Direction' });
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // In unified flow, Back from Find Your Look navigates back to upload
    await expect(page.getByRole('button', { name: /^Continue$/i })).toBeVisible();
  });

  test('3. Genuine API data rendering: Correctly displays genuine attributes and recommendations', async ({ page }) => {
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-genuine-test',
          message: 'Ready for analysis',
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
              faceShape: { value: 'diamond', source: 'Inferred' },
              hairType: { value: 'curly', source: 'Observed' },
              hairLength: { value: 'medium', source: 'Observed' },
              hairThickness: { value: 'thick', source: 'Observed' },
              hairLine: { value: 'receding', source: 'Observed' },
            },
          },
          message: 'Genuine analysis',
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
                id: 'style-genuine-taper',
                name: 'Genuine Mid Taper Fade',
                description: 'Tailored for curly textured hair and diamond face shape.',
                reason: 'Accentuates cheekbone structure while controlling curl volume.',
                stylingEffort: 'medium',
                constraints: ['Use leave-in curl cream'],
                isBestMatch: true,
                bestMatchReason: 'Optimal structure for diamond face and natural curls',
                feasibility: 'Ready Now',
                transitionGuidance: 'Achievable immediately.',
                effort: 'Medium',
                effortDetail: '5-10 min — curl definer',
                limitation: 'Requires curl maintenance product',
                reasonEvidence: [
                  { obs: 'Diamond face shape', contribution: 'Balances angular proportions' },
                  { obs: 'Curly hair pattern', contribution: 'Embraces natural coil definition' },
                ],
                barberBrief: { top: 'Maintain 5cm curl definition', sides: 'Mid skin taper' },
              },
            ],
          },
          message: 'Genuine recommendations',
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Make It Real' }).click();

    await page.getByText(/I agree to photo processing/i).click();
    await page.locator('input[type="file"]').first().setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    // Verify genuine analysis attributes are rendered
    await expect(page.getByRole('heading', { name: 'What we can see' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Diamond', { exact: true })).toBeVisible();
    await expect(page.getByText('Curly', { exact: true })).toBeVisible();
    await expect(page.getByText('Thick', { exact: true })).toBeVisible();
    await expect(page.getByText('Receding', { exact: true })).toBeVisible();

    // In unified flow, observations and recommendations are on the same page
    const seeRecsBtn = page.getByRole('button', { name: 'See Recommendations' });
    if (await seeRecsBtn.isVisible()) {
      await seeRecsBtn.click();
    }

    // Verify genuine recommendation name and reasons are rendered
    const genuineTitle = page.getByRole('heading', { name: 'Genuine Mid Taper Fade' });
    await expect(genuineTitle).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Tailored for curly textured hair and diamond face shape.')).toBeVisible();
    await expect(page.getByText('Accentuates cheekbone structure while controlling curl volume.')).toBeVisible();
    await expect(page.getByText('Best Match').first()).toBeVisible();
    await expect(page.getByText('Try This Look — Preview on Me')).toBeVisible();
  });
});
