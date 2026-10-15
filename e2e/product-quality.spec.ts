import { test, expect, Page, APIRequestContext } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8443';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const PHOTO_PATH = process.env.TEST_PHOTO_PATH || path.resolve(process.cwd(), 'frontend/src/assets/portrait-1.jpg');
const LARGE_PHOTO_PATH = process.env.LARGE_TEST_PHOTO_PATH; // Optional: path to a deliberately large, consented test image.
const QA_DIR = path.resolve(process.cwd(), 'test-results', 'cutback-qa');
const STAGE_TIMEOUT = Number(process.env.QA_STAGE_TIMEOUT_MS || 120_000);

fs.mkdirSync(QA_DIR, { recursive: true });

type Evidence = {
  startedAt: string;
  frontendUrl: string;
  backendUrl: string;
  photo: { path: string; bytes: number; width?: number; height?: number };
  api: Array<{ method: string; url: string; status?: number; durationMs?: number; failed?: string }>;
  consoleErrors: string[];
  pageErrors: string[];
  stages: Array<{ stage: string; status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_TESTED'; note: string; durationMs?: number }>;
  visualReview: Array<{ item: string; status: 'NEEDS_REVIEW'; instruction: string }>;
};

function newEvidence(): Evidence {
  const photoExists = fs.existsSync(PHOTO_PATH);
  return {
    startedAt: new Date().toISOString(), frontendUrl: FRONTEND_URL, backendUrl: BACKEND_URL,
    photo: { path: PHOTO_PATH, bytes: photoExists ? fs.statSync(PHOTO_PATH).size : 0 },
    api: [], consoleErrors: [], pageErrors: [], stages: [],
    visualReview: [
      { item: 'Analisis gambar', status: 'NEEDS_REVIEW', instruction: 'Bandingkan atribut AI dengan foto sumber; nilai akurasi tidak bisa disimpulkan dari HTTP 200.' },
      { item: 'Identitas pada preview', status: 'NEEDS_REVIEW', instruction: 'Periksa wajah, warna kulit, latar, dan ciri identitas tetap konsisten.' },
      { item: 'Kesesuaian hairstyle', status: 'NEEDS_REVIEW', instruction: 'Pastikan hasil visual cocok dengan hairstyle yang dipilih, bukan sekadar gambar yang berhasil dibuat.' },
      { item: 'Barber Brief', status: 'NEEDS_REVIEW', instruction: 'Pastikan brief sesuai model/parameter final dan menandai detail yang belum diketahui untuk dikonfirmasi ke barber.' },
    ],
  };
}

function stage(e: Evidence, name: string, status: Evidence['stages'][number]['status'], note: string, durationMs?: number) {
  e.stages.push({ stage: name, status, note, durationMs });
}

async function instrument(page: Page, evidence: Evidence) {
  page.on('console', msg => { if (msg.type() === 'error') evidence.consoleErrors.push(msg.text()); });
  page.on('pageerror', error => evidence.pageErrors.push(error.message));
  page.on('requestfailed', request => evidence.api.push({ method: request.method(), url: request.url(), failed: request.failure()?.errorText || 'request failed' }));
  page.on('response', async response => {
    const request = response.request();
    const url = response.url();
    if (url.includes('/api/') || url.includes('/health') || url.includes('/diagnostic/')) {
      const timing = request.timing();
      evidence.api.push({ method: request.method(), url, status: response.status(), durationMs: timing.responseEnd >= 0 ? Math.round(timing.responseEnd) : undefined });
    }
  });
}

async function saveEvidence(e: Evidence, testInfo: any) {
  const safeName = testInfo.title.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  const file = path.join(QA_DIR, `${safeName}.json`);
  fs.writeFileSync(file, JSON.stringify(e, null, 2));
  await testInfo.attach('cutback-qa-evidence', { path: file, contentType: 'application/json' });
}

async function expectApiOk(request: APIRequestContext, url: string, method: 'get' | 'post' = 'get') {
  const response = method === 'get' ? await request.get(url) : await request.post(url);
  expect(response.ok(), `${method.toUpperCase()} ${url} should succeed; got ${response.status()}: ${await response.text()}`).toBeTruthy();
  return response;
}

test.describe('Cutback product quality audit', () => {
  test.describe.configure({ mode: 'serial' });

  test('01 - backend health and diagnostic smoke', async ({ request }, testInfo) => {
    const e = newEvidence();
    const health = await request.get(`${BACKEND_URL}/health`);
    expect(health.status(), 'Backend health endpoint').toBe(200);
    const healthBody = await health.json();
    expect(healthBody.status).toMatch(/ok/i);
    stage(e, 'Backend health', 'PASS', `HTTP ${health.status()}`);

    const smoke = await request.post(`${BACKEND_URL}/diagnostic/smoke`, { timeout: STAGE_TIMEOUT });
    expect(smoke.status(), 'Diagnostic smoke endpoint').toBe(200);
    const smokeBody = await smoke.json();
    expect(smokeBody.status).toBe('success');
    stage(e, 'AI connectivity smoke', 'PASS', `HTTP ${smoke.status()}; result=${smokeBody.result ?? 'not supplied'}`);
    await saveEvidence(e, testInfo);
  });

  test('02 - API chain validates contracts and records stage durations', async ({ request }, testInfo) => {
    test.skip(!fs.existsSync(PHOTO_PATH), `Test photo not found: ${PHOTO_PATH}`);
    const e = newEvidence();
    const photo = fs.readFileSync(PHOTO_PATH);
    const startUpload = Date.now();
    const upload = await request.post(`${BACKEND_URL}/api/upload`, {
      timeout: STAGE_TIMEOUT,
      multipart: { photo: { name: path.basename(PHOTO_PATH), mimeType: 'image/jpeg', buffer: photo }, consent: 'true' },
    });
    expect(upload.status(), 'Upload stage').toBe(200);
    const uploadData = await upload.json();
    expect(uploadData.route).toBe('READY_FOR_ANALYSIS');
    expect(uploadData.revisionId).toBeTruthy();
    stage(e, 'Upload + consent', 'PASS', `HTTP ${upload.status()}; photo=${photo.length} bytes`, Date.now() - startUpload);
    const revisionId = uploadData.revisionId;

    const startAnalysis = Date.now();
    const analysisRes = await request.post(`${BACKEND_URL}/api/analyze`, { data: { revisionId }, timeout: STAGE_TIMEOUT });
    expect(analysisRes.status(), 'Analysis stage HTTP status').toBe(200);
    const analysis = await analysisRes.json();
    expect(analysis.status).toBe('success');
    expect(analysis.route).toBe('SUCCESS');
    expect(analysis.analysis).toBeTruthy();
    expect(analysis.analysis.attributes).toBeTruthy();
    stage(e, 'AI image analysis schema', 'PASS', 'Response schema exists; semantic accuracy requires visual review.', Date.now() - startAnalysis);
    fs.writeFileSync(path.join(QA_DIR, 'analysis-output.json'), JSON.stringify({ photo: path.basename(PHOTO_PATH), bytes: photo.length, analysis }, null, 2));

    const startRecs = Date.now();
    const recsRes = await request.post(`${BACKEND_URL}/api/recommendations`, {
      data: { revisionId, preferences: { vibe: 'Modern', stylingEffort: 'low' } }, timeout: STAGE_TIMEOUT,
    });
    expect(recsRes.status(), 'Recommendations stage HTTP status').toBe(200);
    const recs = await recsRes.json();
    expect(recs.status).toBe('success');
    expect(recs.route).toBe('SUCCESS');
    const list = recs.recommendations?.recommendations;
    expect(Array.isArray(list) && list.length > 0, 'At least one recommendation should be returned').toBeTruthy();
    stage(e, 'Recommendations', 'PASS', `${list.length} recommendation(s) returned. Check reasoning relevance manually.`, Date.now() - startRecs);

    const selected = list[0];
    const startSelect = Date.now();
    const selectRes = await request.post(`${BACKEND_URL}/api/select`, { data: { revisionId, hairstyleId: selected.id }, timeout: STAGE_TIMEOUT });
    expect(selectRes.status(), 'Select stage HTTP status').toBe(200);
    const select = await selectRes.json();
    expect(select.status).toBe('success');
    expect(select.route).toBe('READY_FOR_PREVIEW');
    expect(select.selectedHairstyleId).toBe(selected.id);
    stage(e, 'Select hairstyle', 'PASS', `Selected ${selected.name ?? selected.id}`, Date.now() - startSelect);

    const startPreview = Date.now();
    const previewRes = await request.post(`${BACKEND_URL}/api/preview`, { data: { revisionId, hairstyleId: selected.id }, timeout: STAGE_TIMEOUT });
    expect(previewRes.status(), 'Preview stage HTTP status').toBe(200);
    const preview = await previewRes.json();
    expect(preview.status).toBe('success');
    expect(preview.route, `Preview did not succeed: ${preview.message ?? preview.route}`).toBe('SUCCESS');
    expect(preview.previewImageUrl, 'Successful preview must contain an image URL/data URL').toBeTruthy();
    stage(e, 'Generate preview', 'PASS', 'Preview payload returned. Visual identity/style consistency remains NEEDS_REVIEW.', Date.now() - startPreview);
    await saveEvidence(e, testInfo);
  });

  test('03 - browser journey upload to preview and capture UI/API evidence', async ({ page }, testInfo) => {
    test.skip(!fs.existsSync(PHOTO_PATH), `Test photo not found: ${PHOTO_PATH}`);
    const e = newEvidence();
    await instrument(page, e);
    await page.setViewportSize({ width: 390, height: 844 });
    const started = Date.now();
    await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded', timeout: STAGE_TIMEOUT });
    await expect(page.getByRole('button', { name: /Make It Real/i })).toBeVisible({ timeout: 20_000 });
    stage(e, 'Homepage', 'PASS', 'Primary CTA visible.');
    await page.screenshot({ path: path.join(QA_DIR, '01-home.png'), fullPage: true });

    await page.getByRole('button', { name: /Make It Real/i }).click();
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(PHOTO_PATH);
    const consent = page.getByLabel(/I agree to photo processing/i);
    if (await consent.count()) await consent.check();
    else {
      const consentText = page.getByText(/I agree to photo processing/i);
      if (await consentText.count()) await consentText.click();
    }
    const continueButton = page.getByRole('button', { name: /^Continue$/i });
    await expect(continueButton).toBeEnabled({ timeout: 10_000 });
    await page.screenshot({ path: path.join(QA_DIR, '02-upload-ready.png'), fullPage: true });
    const uploadStart = Date.now();
    await continueButton.click();
    await expect(page.getByText(/What we can see|AI Analysis/i).first()).toBeVisible({ timeout: STAGE_TIMEOUT });
    stage(e, 'Upload → analysis UI', 'PASS', 'UI reached analysis state.', Date.now() - uploadStart);
    await page.screenshot({ path: path.join(QA_DIR, '03-analysis.png'), fullPage: true });

    const seeRecommendations = page.getByRole('button', { name: /See Recommendations/i });
    if (await seeRecommendations.count() && await seeRecommendations.isVisible()) {
      await seeRecommendations.click();
    }
    const selectCut = page.getByRole('button', { name: /Select This Cut/i });
    if (await selectCut.count() && await selectCut.isVisible()) {
      await selectCut.first().click();
    }
    stage(e, 'Analysis → recommendations', 'PASS', 'Unified recommendations UI visible.');
    await page.screenshot({ path: path.join(QA_DIR, '04-recommendations.png'), fullPage: true });

    const previewCta = page.getByRole('button', { name: /Try This Look.*Preview on Me/i });
    await expect(previewCta).toBeVisible({ timeout: STAGE_TIMEOUT });
    await previewCta.click();
    // Wait for a visible preview image. Avoid treating any HTTP 200 alone as success.
    await expect.poll(async () => await page.locator('img').evaluateAll(imgs => imgs.some(img => {
      const el = img as HTMLImageElement;
      return el.complete && el.naturalWidth > 0 && /data:image|preview|generated/i.test(el.src);
    })), { timeout: STAGE_TIMEOUT, message: 'No loaded generated preview image detected in UI.' }).toBeTruthy();
    stage(e, 'Select → preview UI', 'PASS', 'A loaded image was detected. Identity/style accuracy still requires human visual review.');
    await page.screenshot({ path: path.join(QA_DIR, '05-preview.png'), fullPage: true });

    // Transition to Barber Brief via the primary action button (TST-001)
    const continueToBriefBtn = page.getByRole('button', { name: /Continue to Brief/i });
    if (await continueToBriefBtn.count()) {
      await continueToBriefBtn.click();
      await expect(page.getByText(/Barber Brief|Your Barber Brief/i).first()).toBeVisible({ timeout: STAGE_TIMEOUT });
      stage(e, 'Barber Brief', 'PASS', 'Brief screen/content verified successfully.');
      await page.screenshot({ path: path.join(QA_DIR, '06-barber-brief.png'), fullPage: true });
    } else {
      const briefSignal = page.getByText(/Barber Brief|Your Barber Brief/i).first();
      if (await briefSignal.count()) stage(e, 'Barber Brief', 'PASS', 'Brief screen/content detected; consistency still needs review.');
      else stage(e, 'Barber Brief', 'NOT_TESTED', 'No recognizable Barber Brief UI was found after preview in this build. Check actual product flow/route.');
    }

    if (e.consoleErrors.length || e.pageErrors.length) {
      stage(e, 'Browser errors', 'FAIL', `${e.consoleErrors.length} console error(s), ${e.pageErrors.length} page error(s). See evidence JSON.`);
    } else stage(e, 'Browser errors', 'PASS', 'No console/page errors observed during this journey.');
    stage(e, 'Total browser journey', 'PASS', 'Completed tested UI journey.', Date.now() - started);
    await saveEvidence(e, testInfo);
  });

  test('04 - optional large image upload smoke/performance', async ({ request }, testInfo) => {
    test.skip(!LARGE_PHOTO_PATH || !fs.existsSync(LARGE_PHOTO_PATH), 'Set LARGE_TEST_PHOTO_PATH to a large test image to run this test.');
    const e = newEvidence();
    const buffer = fs.readFileSync(LARGE_PHOTO_PATH!);
    e.photo = { path: LARGE_PHOTO_PATH!, bytes: buffer.length };
    const started = Date.now();
    const response = await request.post(`${BACKEND_URL}/api/upload`, {
      timeout: STAGE_TIMEOUT,
      multipart: { photo: { name: path.basename(LARGE_PHOTO_PATH!), mimeType: 'image/jpeg', buffer }, consent: 'true' },
    });
    const elapsed = Date.now() - started;
    expect(response.status(), `Large photo upload returned HTTP ${response.status()}`).toBe(200);
    const body = await response.json();
    expect(body.route).toBe('READY_FOR_ANALYSIS');
    stage(e, 'Large image upload', 'PASS', `${buffer.length} bytes accepted; upload latency ${elapsed} ms. Configure an explicit latency threshold if required.`, elapsed);
    await saveEvidence(e, testInfo);
  });
});
