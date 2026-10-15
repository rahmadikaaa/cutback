import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

test.describe('Cutback Backend API Endpoints', () => {
  test('1. Health check returns 200 and ok status', async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/health`);
    expect(response.status(), 'Health check should respond with 200').toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
    expect(data.service).toBe('cutback-backend');
  });

  test('2. Diagnostic smoke test validates AI model connectivity', async ({ request }) => {
    const response = await request.post(`${BACKEND_URL}/diagnostic/smoke`);
    expect(response.status(), 'Smoke test should respond with 200').toBe(200);

    const data = await response.json();
    expect(data.status).toBe('success');
    expect(data.stage).toBe('smoke_test');
    expect(data.result).toBe('OK');
  });

  test('3. Upload endpoint validates required photo and consent', async ({ request }) => {
    // 3a. Upload without file should return 400
    const noFileRes = await request.post(`${BACKEND_URL}/api/upload`, {
      multipart: {
        consent: 'true',
      },
    });
    expect(noFileRes.status()).toBe(400);
    const noFileData = await noFileRes.json();
    expect(noFileData.route).toBe('REUPLOAD');

    // 3b. Upload without consent
    expect(fs.existsSync(LOCAL_TEST_PHOTO), `Test photo must exist at ${LOCAL_TEST_PHOTO}`).toBe(true);
    const photoBuffer = fs.readFileSync(LOCAL_TEST_PHOTO);

    const noConsentRes = await request.post(`${BACKEND_URL}/api/upload`, {
      multipart: {
        photo: {
          name: 'portrait-1.jpg',
          mimeType: 'image/jpeg',
          buffer: photoBuffer,
        },
        consent: 'false',
      },
    });
    expect(noConsentRes.status()).toBe(200);
    const noConsentData = await noConsentRes.json();
    expect(noConsentData.route).toBe('CONSENT_REQUIRED');

    // 3c. Valid upload with consent
    const validRes = await request.post(`${BACKEND_URL}/api/upload`, {
      multipart: {
        photo: {
          name: 'portrait-1.jpg',
          mimeType: 'image/jpeg',
          buffer: photoBuffer,
        },
        consent: 'true',
      },
    });
    expect(validRes.status()).toBe(200);
    const validData = await validRes.json();
    expect(validData.status).toBe('success');
    expect(validData.route).toBe('READY_FOR_ANALYSIS');
    expect(validData.revisionId).toBeDefined();
    expect(typeof validData.revisionId).toBe('string');
  });

  test('4. Full API Chain: Upload -> Analyze -> Recommendations -> Select -> Preview', async ({ request }) => {
    // Stage 1: Upload
    const photoBuffer = fs.readFileSync(LOCAL_TEST_PHOTO);
    const uploadRes = await request.post(`${BACKEND_URL}/api/upload`, {
      multipart: {
        photo: {
          name: 'portrait-1.jpg',
          mimeType: 'image/jpeg',
          buffer: photoBuffer,
        },
        consent: 'true',
      },
    });
    expect(uploadRes.status(), 'Stage: Upload photo failed').toBe(200);
    const uploadData = await uploadRes.json();
    expect(uploadData.route, `Upload route mismatch: ${uploadData.message}`).toBe('READY_FOR_ANALYSIS');
    const revisionId = uploadData.revisionId;
    expect(revisionId).toBeTruthy();

    // Stage 2: AI Analyze
    const analyzeRes = await request.post(`${BACKEND_URL}/api/analyze`, {
      data: { revisionId },
    });
    expect(analyzeRes.status(), 'Stage: Analyze photo HTTP status failed').toBe(200);
    const analyzeData = await analyzeRes.json();
    expect(analyzeData.status).toBe('success');
    expect(
      analyzeData.route,
      `Stage: Analyze photo route was not SUCCESS (got ${analyzeData.route}): ${analyzeData.message}`
    ).toBe('SUCCESS');
    expect(analyzeData.analysis).toBeDefined();
    expect(analyzeData.analysis.visualSuitability.isValid).toBe(true);
    expect(analyzeData.analysis.attributes).toBeDefined();

    // Stage 3: Recommendations
    const recsRes = await request.post(`${BACKEND_URL}/api/recommendations`, {
      data: {
        revisionId,
        preferences: {
          vibe: 'Modern',
          stylingEffort: 'low',
        },
      },
    });
    expect(recsRes.status(), 'Stage: Recommendations HTTP status failed').toBe(200);
    const recsData = await recsRes.json();
    expect(recsData.status).toBe('success');
    expect(
      recsData.route,
      `Stage: Recommendations route was not SUCCESS (got ${recsData.route}): ${recsData.message}`
    ).toBe('SUCCESS');
    expect(recsData.recommendations?.recommendations?.length).toBeGreaterThan(0);

    const firstRec = recsData.recommendations.recommendations[0];
    expect(firstRec.id).toBeDefined();
    expect(firstRec.name).toBeDefined();

    // Stage 4: Select hairstyle
    const selectRes = await request.post(`${BACKEND_URL}/api/select`, {
      data: {
        revisionId,
        hairstyleId: firstRec.id,
      },
    });
    expect(selectRes.status(), 'Stage: Select hairstyle HTTP status failed').toBe(200);
    const selectData = await selectRes.json();
    expect(selectData.status).toBe('success');
    expect(selectData.route).toBe('READY_FOR_PREVIEW');
    expect(selectData.selectedHairstyleId).toBe(firstRec.id);

    // Stage 5: Generate preview
    const previewRes = await request.post(`${BACKEND_URL}/api/preview`, {
      data: {
        revisionId,
        hairstyleId: firstRec.id,
      },
    });
    expect(previewRes.status(), 'Stage: Generate preview HTTP status failed').toBe(200);
    const previewData = await previewRes.json();
    expect(previewData.status).toBe('success');
    // previewData.route can be SUCCESS or handled AI generation route
    if (previewData.route !== 'SUCCESS') {
      console.warn(`[API Preview Info] Route: ${previewData.route}, message: ${previewData.message}`);
    } else {
      expect(previewData.previewImageUrl).toBeDefined();
    }
  });
});
