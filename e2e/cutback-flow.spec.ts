import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

interface ApiLog {
  stage: string;
  url: string;
  method: string;
  status?: number;
  route?: string;
  message?: string;
  durationMs?: number;
  error?: string;
}

test.describe('Cutback E2E User Flow', () => {
  test('Complete flow: Open App -> Upload Photo -> AI Analysis -> Recommendations -> Select Cut -> Preview', async ({
    page,
  }) => {
    // 1. Setup error listeners & QA logs
    const consoleErrors: string[] = [];
    const failedRequests: string[] = [];
    const apiLogs: ApiLog[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    page.on('requestfailed', (req) => {
      const failure = req.failure();
      failedRequests.push(`[Request Failed] ${req.method()} ${req.url()}: ${failure?.errorText || 'Unknown error'}`);
    });

    // Intercept backend API calls for deterministic QA auditing
    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/api/')) {
        const stage = url.split('/api/')[1].split('?')[0];
        try {
          const contentType = res.headers()['content-type'] || '';
          let data: any = null;
          if (contentType.includes('application/json')) {
            data = await res.json().catch(() => null);
          }
          apiLogs.push({
            stage,
            url,
            method: res.request().method(),
            status: res.status(),
            route: data?.route,
            message: data?.message,
          });
        } catch (err: any) {
          apiLogs.push({
            stage,
            url,
            method: res.request().method(),
            status: res.status(),
            error: err.message,
          });
        }
      }
    });

    // 2. Open Application
    console.log('\n[E2E STEP 1] Buka aplikasi Cutback');
    await page.goto('/');

    // Assert Homepage is rendered
    const heroHeading = page.locator('h1');
    await expect(heroHeading, 'Hero heading should be visible on Homepage').toBeVisible();

    const makeItRealBtn = page.getByRole('button', { name: 'Make It Real' });
    await expect(makeItRealBtn, 'CTA "Make It Real" button must be visible').toBeVisible();

    // QA Evidence: Screenshot Homepage
    await page.screenshot({ path: 'test-results/qa-01-home.png', fullPage: true });

    // 3. Navigate to Upload Screen
    console.log('[E2E STEP 2] Navigasi ke halaman Upload');
    await makeItRealBtn.click();

    // Verify Upload Screen
    const uploadTitle = page.getByRole('heading', { name: 'Take Your Photo' });
    await expect(uploadTitle, 'Halaman "Take Your Photo" harus ditampilkan').toBeVisible();

    // 4. Upload photo & consent
    console.log('[E2E STEP 3] Upload foto uji lokal dan berikan consent');
    expect(fs.existsSync(LOCAL_TEST_PHOTO), `Test photo harus ada di ${LOCAL_TEST_PHOTO}`).toBe(true);

    // Locate hidden file input and attach local photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);

    // Wait for image preview in upload screen
    const selectedImg = page.locator('img[alt="Selected photo"]');
    await expect(selectedImg, 'Preview foto yang diunggah harus muncul').toBeVisible();

    // Toggle consent checkbox
    const consentLabel = page.getByText('I agree to photo processing');
    await expect(consentLabel, 'Label consent harus terlihat').toBeVisible();
    await consentLabel.click();

    // Continue button should be enabled
    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn, 'Tombol Continue harus aktif setelah foto dan consent dipilih').toBeEnabled();

    // QA Evidence: Screenshot Upload Ready
    await page.screenshot({ path: 'test-results/qa-02-upload-ready.png', fullPage: true });

    // 5. Submit Upload and wait for API response
    console.log('[E2E STEP 4] Submit upload photo ke backend API');
    const uploadResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/upload') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );

    await continueBtn.click();

    const uploadResponse = await uploadResponsePromise;
    expect(uploadResponse.status(), `Status upload harus 200, didapat: ${uploadResponse.status()}`).toBe(200);
    const uploadJson = await uploadResponse.json();
    expect(
      uploadJson.route,
      `Upload route harus READY_FOR_ANALYSIS. Pesan backend: ${uploadJson.message}`
    ).toBe('READY_FOR_ANALYSIS');
    expect(uploadJson.revisionId, 'Revision ID harus dikembalikan oleh backend').toBeTruthy();

    console.log(`[E2E STEP 4 PASS] Upload berhasil, revisionId: ${uploadJson.revisionId}`);

    // 6. Monitor AI Analysis
    console.log('[E2E STEP 5] Menunggu proses AI Analysis...');
    const analyzeResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/analyze') && res.request().method() === 'POST',
      { timeout: 45_000 }
    );

    const analyzeResponse = await analyzeResponsePromise;
    expect(analyzeResponse.status(), `Status analyze harus 200, didapat: ${analyzeResponse.status()}`).toBe(200);
    const analyzeJson = await analyzeResponse.json();

    // Cek apakah analyze berhasil atau gagal
    if (analyzeJson.route !== 'SUCCESS') {
      await page.screenshot({ path: 'test-results/qa-failure-analysis.png', fullPage: true });
      throw new Error(
        `[E2E GAGAL TAHAP ANALISIS] Endpoint: /api/analyze, Status: ${analyzeResponse.status()}, Route: ${analyzeJson.route}, Message: ${analyzeJson.message}`
      );
    }

    console.log('[E2E STEP 5 PASS] Analisis AI berhasil:', analyzeJson.analysis?.attributes);

    // Verify Analysis Results Screen
    const whatWeSeeHeading = page.getByRole('heading', { name: 'What we can see' });
    await expect(whatWeSeeHeading, 'Layar hasil analisis "What we can see" harus tampil').toBeVisible();

    // QA Evidence: Screenshot Analysis Results
    await page.screenshot({ path: 'test-results/qa-03-analysis-results.png', fullPage: true });

    // 7. Request Hairstyle Recommendations
    console.log('[E2E STEP 6] Meminta Rekomendasi Hairstyle...');
    const recsResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/recommendations') && res.request().method() === 'POST',
      { timeout: 45_000 }
    );

    const seeRecommendationsBtn = page.getByRole('button', { name: 'See Recommendations' });
    await expect(seeRecommendationsBtn).toBeVisible();
    await seeRecommendationsBtn.click();

    const recsResponse = await recsResponsePromise;
    expect(recsResponse.status(), `Status recommendations harus 200, didapat: ${recsResponse.status()}`).toBe(200);
    const recsJson = await recsResponse.json();

    if (recsJson.route !== 'SUCCESS') {
      await page.screenshot({ path: 'test-results/qa-failure-recommendations.png', fullPage: true });
      throw new Error(
        `[E2E GAGAL TAHAP REKOMENDASI] Endpoint: /api/recommendations, Status: ${recsResponse.status()}, Route: ${recsJson.route}, Message: ${recsJson.message}`
      );
    }

    // Verify Recommendations Screen
    const selectCutBtn = page.getByRole('button', { name: 'Select This Cut', exact: true });
    await expect(selectCutBtn, 'Tombol "Select This Cut" harus terlihat di layar rekomendasi').toBeVisible();

    // QA Evidence: Screenshot Recommendations
    await page.screenshot({ path: 'test-results/qa-04-recommendations.png', fullPage: true });
    console.log('[E2E STEP 6 PASS] Layar rekomendasi hairstyle berhasil dimuat');

    // 8. Select Hairstyle
    console.log('[E2E STEP 7] Memilih Hairstyle');
    await selectCutBtn.click();

    // The button state should change to selected
    const selectedBtn = page.getByRole('button', { name: '✓ Selected' });
    await expect(selectedBtn, 'Tombol harus berubah menjadi "✓ Selected"').toBeVisible();

    // The Preview CTA button should now be visible
    const previewCtaBtn = page.getByRole('button', { name: 'Try This Look — Preview on Me' });
    await expect(previewCtaBtn, 'Tombol CTA "Try This Look — Preview on Me" harus muncul').toBeVisible();

    // 9. Generate AI Preview
    console.log('[E2E STEP 8] Generate Preview...');
    const selectApiPromise = page.waitForResponse(
      (res) => res.url().includes('/api/select') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );
    const previewApiPromise = page.waitForResponse(
      (res) => res.url().includes('/api/preview') && res.request().method() === 'POST',
      { timeout: 90_000 }
    );

    await previewCtaBtn.click();

    // Wait for /api/select
    const selectRes = await selectApiPromise;
    expect(selectRes.status(), `Status /api/select harus 200, didapat: ${selectRes.status()}`).toBe(200);
    const selectJson = await selectRes.json();
    expect(selectJson.route).toBe('READY_FOR_PREVIEW');
    console.log('[E2E STEP 8a PASS] /api/select berhasil dengan route READY_FOR_PREVIEW');

    // Wait for /api/preview
    const previewRes = await previewApiPromise;
    expect(previewRes.status(), `Status /api/preview harus 200, didapat: ${previewRes.status()}`).toBe(200);
    const previewJson = await previewRes.json();

    console.log(`[E2E STEP 8b] /api/preview respons: route=${previewJson.route}, message=${previewJson.message}`);

    // If preview succeeded, screen shows preview comparison with continue button
    // If preview failed, screen shows handled PreviewFailureScreen
    if (previewJson.route === 'SUCCESS') {
      const continueToBriefBtn = page.getByRole('button', { name: 'Continue' });
      await expect(continueToBriefBtn, 'Layar preview berhasil harus memiliki tombol Continue').toBeVisible();
      await page.screenshot({ path: 'test-results/qa-05-preview-success.png', fullPage: true });
      console.log('[E2E STEP 8 PASS] AI Preview berhasil di-generate dan ditampilkan');
    } else {
      // Record graceful degradation / failure screen
      const retryBtn = page.getByRole('button', { name: 'Retry Preview' });
      const continueWithoutBtn = page.getByRole('button', { name: 'Continue Without Preview' });
      await expect(
        retryBtn.or(continueWithoutBtn),
        'Layar preview failure harus menyediakan opsi retry atau continue without preview'
      ).toBeVisible();

      await page.screenshot({ path: 'test-results/qa-05-preview-handled-failure.png', fullPage: true });
      console.warn(
        `[E2E Preview Stage Handled Result] Route: ${previewJson.route}, Pesan: ${previewJson.message}`
      );
    }

    // 10. Audit console errors
    console.log('\n--- QA AUDIT SUMMARY ---');
    console.log(`Total API Calls intercepted: ${apiLogs.length}`);
    for (const log of apiLogs) {
      console.log(`  - [${log.method}] ${log.stage}: HTTP ${log.status} (route: ${log.route || 'none'})`);
    }

    if (failedRequests.length > 0) {
      console.warn(`Failed network requests (${failedRequests.length}):\n`, failedRequests.join('\n'));
    }

    // Filter out benign Vite/React hydration logs or expected warnings
    const fatalErrors = consoleErrors.filter(
      (e) => !e.includes('favicon') && !e.includes('Download the React DevTools')
    );
    if (fatalErrors.length > 0) {
      console.warn(`Browser console errors (${fatalErrors.length}):\n`, fatalErrors.join('\n'));
    }
  });
});
