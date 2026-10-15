import { test, expect } from '@playwright/test';
import * as path from 'path';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

test.describe('Phase 2: Recommendation Evidence & Provenance Verification', () => {
  test('1. Structured evidence preserves Inferred and User-provided provenance badges distinctly', async ({ page }) => {
    // Intercept upload
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-phase2-provenance',
          message: 'Ready for analysis',
        }),
      });
    });

    // Intercept analyze with Observed, Inferred, and Unknown attributes
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
              faceShape: { value: 'oval', source: 'Inferred' },
              hairType: { value: 'straight', source: 'Observed' },
              hairLength: { value: 'short', source: 'Observed' },
              hairThickness: { value: 'unknown', source: 'Unknown' },
              hairLine: { value: 'straight', source: 'Observed' },
            },
          },
          message: 'Analysis success',
        }),
      });
    });

    // Intercept recommendations returning structured reasonEvidence and parenthetical name
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
                id: 'style-crew-cepak',
                name: 'Classic Crew Cut (Cepak)',
                description: 'Timeless short back and sides with textured neat top.',
                reason: 'Balances your proportions cleanly.',
                reasonEvidence: [
                  {
                    attribute: 'Face Shape',
                    value: 'Oval',
                    source: 'Inferred',
                    contribution: 'Likely oval face proportions framed naturally by this cut'
                  },
                  {
                    attribute: 'Hair Pattern',
                    value: 'Straight',
                    source: 'Observed',
                    contribution: 'Works with natural straight hair movement'
                  },
                  {
                    attribute: 'User Preference',
                    value: 'cepak',
                    source: 'User-provided',
                    contribution: 'Personal preference for "cepak" influences style direction without altering photo findings'
                  }
                ],
                stylingEffort: 'low',
                constraints: ['Regular maintenance every 2-3 weeks'],
                isBestMatch: true,
                bestMatchReason: 'Optimal match for your preferences and profile',
                feasibility: 'Ready Now',
                barberBrief: {
                  top: 'Scissor-cut to 1-1.5 inches',
                  sides: 'Tapered clean finish',
                  back: 'Tapered neckline',
                  styling: 'Minimal product needed'
                }
              }
            ]
          },
          message: 'Recommendations ready',
        }),
      });
    });

    // Intercept select and preview
    await page.route(url => url.pathname === '/api/select', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_PREVIEW',
          selectedHairstyleId: 'style-crew-cepak',
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
        }),
      });
    });

    await page.goto('/');
    await page.getByRole('button', { name: 'Make It Real' }).click();

    await page.getByText(/I agree to photo processing/i).click();
    await page.locator('input[type="file"]').first().setInputFiles(LOCAL_TEST_PHOTO);
    await page.getByRole('button', { name: /^Continue$/i }).click();

    // Verify unified Find Your Look displays observations and recommendations together
    await expect(page.getByRole('heading', { name: 'What we can see' })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Oval', { exact: true })).toBeVisible();

    // In unified flow, observations and recommendations are on the same page
    const seeRecsBtn = page.getByRole('button', { name: 'See Recommendations' });
    if (await seeRecsBtn.isVisible()) {
      await seeRecsBtn.click();
    }

    // Verify recommendations screen is displayed with back button and canonical haircut name
    const backBtn = page.getByRole('button', { name: /Go back/i }).first();
    await expect(backBtn).toBeVisible({ timeout: 15_000 });

    // Canonical name check: name should NOT retain "(Cepak)"
    const heading = page.locator('h2', { hasText: 'Classic Crew Cut' }).first();
    await expect(heading).toBeVisible();
    await expect(heading).not.toHaveText(/Classic Crew Cut \(Cepak\)/);

    // Verify provenance badges are rendered
    await expect(page.getByText('INFERRED').first()).toBeVisible();
    await expect(page.getByText('USER-PROVIDED').first()).toBeVisible();

    // Verify cautious wording on inferred attribute
    await expect(page.getByText(/Likely oval face/i).first()).toBeVisible();

    // Verify user preference is distinct from photo observation
    await expect(page.getByText(/Preference: cepak/i).first()).toBeVisible();

    // Navigate to preview -> Barber Brief
    await page.getByRole('button', { name: /Try This Look/i }).click();

    const continueBriefBtn = page.getByRole('button', { name: /Continue to Brief/i });
    await expect(continueBriefBtn).toBeVisible({ timeout: 15_000 });
    await continueBriefBtn.click();

    // Verify Barber Brief displays canonical haircut name and structured handoff
    await expect(page.getByRole('heading', { name: 'Classic Crew Cut' })).toBeVisible();
    await expect(page.getByText('Scissor-cut to 1-1.5 inches')).toBeVisible();
  });
});
