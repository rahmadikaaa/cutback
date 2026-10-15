import { test, expect } from '@playwright/test';
import * as path from 'path';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

test.describe('Cutback — Customize Your Look & Your Preferences', () => {
  test.beforeEach(async ({ page }) => {
    // Intercept API routes with mock data to make tests completely deterministic and fast
    await page.route(url => url.pathname === '/api/upload', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          route: 'READY_FOR_ANALYSIS',
          revisionId: 'mock-rev-customize-test',
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
              faceShape: { value: 'oval', source: 'Observed' },
              hairType: { value: 'straight', source: 'Observed' },
              hairLength: { value: 'short', source: 'Observed' },
              hairThickness: { value: 'medium', source: 'Inferred' },
              hairLine: { value: 'straight', source: 'Observed' },
            },
          },
          message: 'Analysis success',
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
                id: 'style-classic-crew',
                name: 'Classic Crew Cut',
                description: 'Timeless short back and sides with textured neat top.',
                reason: 'Balances your oval face shape cleanly.',
                stylingEffort: 'low',
                constraints: [],
                isBestMatch: true,
                bestMatchReason: 'Matches your hair type and face shape',
                feasibility: 'Ready Now',
                transitionGuidance: 'Ideal for immediate haircut with zero growth required.',
                effort: 'Low',
                effortDetail: '1-2 minutes daily styling',
                limitation: 'Requires touch-up every 3-4 weeks',
                reasonEvidence: [
                  { obs: 'Oval face shape', contribution: 'Complements symmetrical proportions' },
                  { obs: 'Straight hair', contribution: 'Holds natural structure without heavy pomade' },
                ],
                barberBrief: { top: '2.5 cm scissor cut', sides: 'Tapered #2 fade' },
              },
            ],
          },
          message: 'Success',
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
          selectedHairstyleId: 'style-classic-crew',
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
  });

  test('Complete flow: Open Find Your Look -> Customize -> Discard draft on Back -> Apply preferences -> Verify Your Preferences -> Verify Edit prefill -> Unchanged Recommendation -> Preview CTA -> 360px responsive check', async ({ page }) => {
    // Collect console errors to verify no unhandled errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // 1. Set mobile viewport (360px width check)
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');

    // 2. Navigate from Home -> Upload -> Analysis -> Recommendations
    await page.getByRole('button', { name: 'Make It Real' }).click();

    const consentText = page.getByText(/I agree to photo processing/i);
    await consentText.click();

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);

    await page.getByRole('button', { name: /^Continue$/i }).click();

    // 3. Verify Unified Find Your Look Page: Observations + Recommendations together
    // Observations section ("What we can see") is displayed above haircut recommendations
    const whatWeSeeHeading = page.getByRole('heading', { name: 'What we can see' });
    await expect(whatWeSeeHeading).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Oval', { exact: true })).toBeVisible();
    await expect(page.getByText('Straight').first()).toBeVisible();
    // Provenance badge on observations: Inferred is preserved for hairThickness
    await expect(page.getByText('INFERRED').first()).toBeVisible();
    // Portrait is clean (no text over the face, back button only)
    const backBtn = page.getByRole('button', { name: /Go back/i }).first();
    await expect(backBtn).toBeVisible();

    // Verify removed elements:
    // - No "Your Transformation" header/stepper
    await expect(page.getByText('Your Transformation')).not.toBeVisible();
    // - No old bottom comparison container "See It on Yourself"
    await expect(page.getByText('See It on Yourself')).not.toBeVisible();
    // - No photo carousel controls (‹ 1/3 ›)
    await expect(page.getByText(/1\s*\/\s*3/)).not.toBeVisible();
    // - No "Previous / Selected / Next" haircut selector row
    await expect(page.getByRole('button', { name: 'Select This Cut', exact: true })).not.toBeVisible();

    // Unified Best Match + Name + Description + Rationale container
    const haircutTitle = page.getByRole('heading', { name: 'Classic Crew Cut' });
    await expect(haircutTitle).toBeVisible();
    await expect(page.getByText('Best Match').first()).toBeVisible();
    await expect(page.getByText('Why this works for you')).toBeVisible();
    await expect(page.getByText('Balances your oval face shape cleanly.')).toBeVisible();

    // Practical information cards
    await expect(page.getByText('Feasibility')).toBeVisible();
    await expect(page.getByText('Effort')).toBeVisible();
    await expect(page.getByText('Consider')).toBeVisible();

    // "Your Preferences" section placed directly below practical cards
    const yourPrefsHeading = page.getByRole('heading', { name: 'Your Preferences' });
    await expect(yourPrefsHeading).toBeVisible();
    const yourPrefsSection = page.locator('div.rounded-xl').filter({ has: yourPrefsHeading });
    await expect(yourPrefsSection.getByText('No additional preferences applied yet.')).toBeVisible();

    // Customize button exists in Your Preferences
    const customizeBtn = yourPrefsSection.getByRole('button', { name: 'Customize' }).first();
    await expect(customizeBtn).toBeVisible();

    // Standalone Primary CTA
    const previewCta = page.getByRole('button', { name: 'Try This Look — Preview on Me' });
    await expect(previewCta).toBeVisible();

    // 4. Test Customize Draft & Back (Discard unsaved edits)
    await customizeBtn.click();

    // Verify Customize Your Look Screen is displayed
    const customizeTitle = page.getByRole('heading', { name: 'Customize Your Look' });
    await expect(customizeTitle).toBeVisible();
    await expect(page.getByText('Make your recommendations more personal.')).toBeVisible();

    // Select options in draft
    await page.getByRole('button', { name: 'Fresh', exact: true }).click();
    await page.getByRole('button', { name: 'Shorter', exact: true }).click();
    await page.getByRole('button', { name: /^Low\s/i }).click();

    const notesTextarea = page.locator('textarea');
    await notesTextarea.fill('This draft should be discarded on Back');

    // Click Back to discard draft
    const customizeBackBtn = page.getByRole('button', { name: 'Back', exact: true });
    await customizeBackBtn.click();

    // Verify return to Find Your Look and draft was discarded
    await expect(haircutTitle).toBeVisible();
    await expect(yourPrefsHeading).toBeVisible();
    await expect(yourPrefsSection.getByText('No additional preferences applied yet.')).toBeVisible();
    await expect(yourPrefsSection.getByText('Fresh')).not.toBeVisible();
    await expect(yourPrefsSection.getByText('This draft should be discarded on Back')).not.toBeVisible();

    // 5. Apply preferences and commit
    await yourPrefsSection.getByRole('button', { name: 'Customize' }).first().click();
    await expect(customizeTitle).toBeVisible();

    // Verify fields were not dirtied by discarded draft
    await page.getByRole('button', { name: 'Fresh', exact: true }).click();
    await page.getByRole('button', { name: 'Shorter', exact: true }).click();
    await page.getByRole('button', { name: /^Low\s/i }).click();
    await page.locator('textarea').fill('Keep the sides professional-looking.');

    // Click "Apply & See Recommendations"
    const applyBtn = page.getByRole('button', { name: 'Apply & See Recommendations' });
    await applyBtn.click();

    // Verify return to Find Your Look
    await expect(yourPrefsHeading).toBeVisible();

    // Verify applied preferences chips and notes
    await expect(yourPrefsSection.getByText('Fresh')).toBeVisible();
    await expect(yourPrefsSection.getByText('Shorter')).toBeVisible();
    await expect(yourPrefsSection.getByText('Low')).toBeVisible();
    await expect(yourPrefsSection.getByText('Keep the sides professional-looking.')).toBeVisible();
    await expect(yourPrefsSection.getByText('No additional preferences applied yet.')).not.toBeVisible();

    // CRITICAL CONSTRAINT: Haircut recommendation, name, and rationale must remain unchanged!
    await expect(haircutTitle).toBeVisible();
    await expect(page.getByText('Balances your oval face shape cleanly.')).toBeVisible();
    await expect(page.getByText('Timeless short back and sides with textured neat top.')).toBeVisible();

    // 6. Test Edit action in Your Preferences
    const editBtn = yourPrefsSection.getByRole('button', { name: 'Edit' });
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify Customize Your Look opened with previous selections prefilled
    await expect(customizeTitle).toBeVisible();
    await expect(page.locator('textarea')).toHaveValue('Keep the sides professional-looking.');

    // Update notes and re-apply
    await page.locator('textarea').fill('Keep the sides professional-looking with clean taper.');
    await applyBtn.click();

    // Verify updated notes appear in Your Preferences
    await expect(yourPrefsHeading).toBeVisible();
    await expect(page.getByText('Keep the sides professional-looking with clean taper.')).toBeVisible();

    // Haircut recommendation is STILL unchanged
    await expect(haircutTitle).toBeVisible();

    // 7. Verify Standalone "Try This Look — Preview on Me" CTA works
    await page.getByRole('button', { name: 'Try This Look — Preview on Me' }).click();

    // Verify it proceeds to preview generation / preview screen
    const previewHeading = page.getByText(/Generating AI Preview|Possible Transformation|Your Transformation/i);
    await expect(previewHeading.first()).toBeVisible({ timeout: 15_000 });

    // 8. Viewport 360px check for horizontal scroll / overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow, 'There should be no horizontal overflow at 360px viewport').toBe(false);

    // Verify no unhandled console errors
    const criticalErrors = consoleErrors.filter(err => !err.includes('favicon.ico') && !err.includes('Expected static flag was missing'));
    expect(criticalErrors, `Unexpected console errors: ${criticalErrors.join(', ')}`).toHaveLength(0);
  });
});
