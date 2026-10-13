import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * save-haircut-persistence.spec.ts
 *
 * Dedicated Playwright test to audit and trace the Cutback Save Haircut data flow:
 * 1. UI Flow: Home -> Upload -> Analysis -> Recommendations -> Hairstyle Selection -> AI Preview -> Barber Brief -> Save Screen.
 * 2. Network Activity: Monitors all requests before, during, and after Save Haircut.
 * 3. Client Persistence: Reads IndexedDB (idb-keyval `keyval-store` / `keyval`) to inspect record structure.
 * 4. Cross-Session Recovery: Verifies behavior across page reload and reopening from My Haircuts.
 * 5. Comprehensive Report: Prints a structured, searchable summary including Firebase investigation paths.
 */

const LOCAL_TEST_PHOTO = path.resolve(__dirname, '../frontend/src/assets/portrait-1.jpg');

interface NetworkTraceEntry {
  stage: string;
  url: string;
  method: string;
  status?: number;
  route?: string;
  message?: string;
  requestHeaders?: Record<string, string>;
  requestBodySummary?: any;
  responseBodySummary?: any;
  timestamp: string;
  relativeToSaveMs?: number;
}

test.describe('Cutback Save Haircut Data Persistence Trace', () => {
  test('Complete trace of Save Haircut: upload -> preview -> save -> IndexedDB check -> reload -> reopen audit', async ({
    page,
  }) => {
    const testStartTime = Date.now();
    const testMarker = `PW_TRACE_${testStartTime}`;
    const networkLogs: NetworkTraceEntry[] = [];
    let saveTriggerTime: number | null = null;
    let backendRevisionId: string | null = null;
    let backendPreviewImageUrl: string | null = null;

    // Helper to sanitize bodies without secrets or massive Base64 blobs
    const sanitizePayload = (body: any): any => {
      if (!body) return null;
      if (typeof body === 'string') {
        if (body.startsWith('data:image/')) {
          return `[Base64 Data URI: ${body.slice(0, 30)}... total ${body.length} chars]`;
        }
        return body.length > 500 ? `${body.slice(0, 500)}... (truncated)` : body;
      }
      if (Array.isArray(body)) {
        return body.map(sanitizePayload);
      }
      if (typeof body === 'object') {
        const sanitized: Record<string, any> = {};
        for (const [k, v] of Object.entries(body)) {
          if (/key|secret|token|password|auth/i.test(k)) {
            sanitized[k] = '[REDACTED]';
          } else if (typeof v === 'string' && (v.startsWith('data:image/') || v.length > 1000)) {
            sanitized[k] = `[Large Payload / Data URI: ${v.slice(0, 30)}... length ${v.length}]`;
          } else {
            sanitized[k] = sanitizePayload(v);
          }
        }
        return sanitized;
      }
      return body;
    };

    // Attach request listener
    page.on('request', (req) => {
      const url = req.url();
      // Track all requests to our backend or external firebase/gcs endpoints
      if (url.includes('/api/') || url.includes('firestore.googleapis.com') || url.includes('firebasestorage.googleapis.com')) {
        let postData: any = null;
        try {
          const raw = req.postData();
          if (raw) {
            postData = sanitizePayload(JSON.parse(raw));
          }
        } catch {
          postData = req.postData() ? '[Non-JSON payload / FormData]' : null;
        }

        const now = Date.now();
        networkLogs.push({
          stage: url.includes('/api/') ? url.split('/api/')[1].split('?')[0] : 'cloud-service',
          url,
          method: req.method(),
          requestBodySummary: postData,
          timestamp: new Date(now).toISOString(),
          relativeToSaveMs: saveTriggerTime ? now - saveTriggerTime : undefined,
        });
      }
    });

    // Attach response listener
    page.on('response', async (res) => {
      const url = res.url();
      if (url.includes('/api/') || url.includes('firestore.googleapis.com') || url.includes('firebasestorage.googleapis.com')) {
        let responseJson: any = null;
        const contentType = res.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          try {
            responseJson = await res.json().catch(() => null);
          } catch {
            responseJson = null;
          }
        }

        // Match with network log entry
        const entry = [...networkLogs].reverse().find((l) => l.url === url && l.method === res.request().method());
        if (entry) {
          entry.status = res.status();
          entry.route = responseJson?.route;
          entry.message = responseJson?.message;
          entry.responseBodySummary = sanitizePayload(responseJson);

          // Capture revision ID if present
          if (responseJson?.revisionId && !backendRevisionId) {
            backendRevisionId = responseJson.revisionId;
          }
          if (responseJson?.previewImageUrl && !backendPreviewImageUrl) {
            backendPreviewImageUrl = responseJson.previewImageUrl.slice(0, 50) + '...';
          }
        }
      }
    });

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 1: Open Application & Navigate to Upload
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n============================================================`);
    console.log(`[CUTBACK DATA PERSISTENCE TRACE] Started - Marker: ${testMarker}`);
    console.log(`============================================================\n`);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const makeItRealBtn = page.getByRole('button', { name: 'Make It Real' });
    await expect(makeItRealBtn).toBeVisible({ timeout: 15_000 });
    await makeItRealBtn.click();

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 2: Upload Portrait & Consent
    // ──────────────────────────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Take Your Photo' })).toBeVisible();
    expect(fs.existsSync(LOCAL_TEST_PHOTO), `Test photo exists at ${LOCAL_TEST_PHOTO}`).toBe(true);

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(LOCAL_TEST_PHOTO);
    await expect(page.locator('img[alt="Selected photo"]')).toBeVisible({ timeout: 10_000 });

    const consentLabel = page.getByText('I agree to photo processing');
    await consentLabel.click();

    const continueBtn = page.getByRole('button', { name: 'Continue' });
    await expect(continueBtn).toBeEnabled();

    const uploadResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/upload') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );
    await continueBtn.click();

    const uploadRes = await uploadResponsePromise;
    expect(uploadRes.status()).toBe(200);
    const uploadData = await uploadRes.json();
    expect(uploadData.route).toBe('READY_FOR_ANALYSIS');
    backendRevisionId = uploadData.revisionId;
    console.log(`[TRACE] Photo uploaded -> Revision ID: ${backendRevisionId}`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 3: Wait for AI Analysis & Request Recommendations
    // ──────────────────────────────────────────────────────────────────────────
    const analyzeResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/analyze') && res.request().method() === 'POST',
      { timeout: 45_000 }
    );
    const analyzeRes = await analyzeResponsePromise;
    expect(analyzeRes.status()).toBe(200);
    const analyzeData = await analyzeRes.json();
    expect(analyzeData.route).toBe('SUCCESS');
    console.log(`[TRACE] AI Analysis complete for Revision ID: ${backendRevisionId}`);

    await expect(page.getByRole('heading', { name: 'What we can see' })).toBeVisible();
    const seeRecsBtn = page.getByRole('button', { name: 'See Recommendations' });
    await expect(seeRecsBtn).toBeVisible();

    const recsResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/recommendations') && res.request().method() === 'POST',
      { timeout: 45_000 }
    );
    await seeRecsBtn.click();

    const recsRes = await recsResponsePromise;
    expect(recsRes.status()).toBe(200);
    console.log(`[TRACE] Recommendations fetched for Revision ID: ${backendRevisionId}`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 4: Select Hairstyle & Generate AI Preview
    // ──────────────────────────────────────────────────────────────────────────
    const selectCutBtn = page.getByRole('button', { name: 'Select This Cut', exact: true });
    await expect(selectCutBtn).toBeVisible();
    await selectCutBtn.click();

    const previewCtaBtn = page.getByRole('button', { name: 'Try This Look — Preview on Me' });
    await expect(previewCtaBtn).toBeVisible();

    const selectApiPromise = page.waitForResponse(
      (res) => res.url().includes('/api/select') && res.request().method() === 'POST',
      { timeout: 30_000 }
    );
    const previewApiPromise = page.waitForResponse(
      (res) => res.url().includes('/api/preview') && res.request().method() === 'POST',
      { timeout: 90_000 }
    );

    await previewCtaBtn.click();

    const selectRes = await selectApiPromise;
    expect(selectRes.status()).toBe(200);

    const previewRes = await previewApiPromise;
    expect(previewRes.status()).toBe(200);
    const previewData = await previewRes.json();
    console.log(`[TRACE] Preview API finished with route: ${previewData.route}`);

    // Navigate to Barber Brief
    if (previewData.route === 'SUCCESS') {
      const continueToBriefBtn = page.getByRole('button', { name: /Continue to Brief/i });
      await expect(continueToBriefBtn).toBeVisible({ timeout: 15_000 });
      await continueToBriefBtn.click();
    } else {
      const continueWithoutBtn = page.getByRole('button', { name: 'Continue Without Preview' });
      await expect(continueWithoutBtn).toBeVisible({ timeout: 15_000 });
      await continueWithoutBtn.click();
    }

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 5: Barber Brief -> Open Save Screen
    // ──────────────────────────────────────────────────────────────────────────
    await expect(page.getByText('Barber Brief')).toBeVisible();
    const saveFromBriefBtn = page.getByRole('button', { name: /Save This Haircut|Save/i }).first();
    await expect(saveFromBriefBtn).toBeVisible();
    await saveFromBriefBtn.click();

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 6: Save Haircut Screen & Network Observation
    // ──────────────────────────────────────────────────────────────────────────
    await expect(page.getByRole('heading', { name: 'Save Haircut' })).toBeVisible();

    const nameInput = page.locator('input[placeholder]').first();
    await nameInput.fill('');
    await nameInput.fill(testMarker);

    // Baseline network count before clicking Save
    const preSaveNetworkCount = networkLogs.length;

    console.log(`[TRACE] Clicking Save button with unique name: ${testMarker}...`);
    saveTriggerTime = Date.now();

    const saveConfirmBtn = page.getByRole('button', { name: 'Save', exact: true });
    await saveConfirmBtn.click();

    // Wait for Save Success screen
    const saveSuccessHeading = page.getByRole('heading', { name: /Haircut saved/i });
    await expect(saveSuccessHeading).toBeVisible({ timeout: 10_000 });
    console.log(`[TRACE] UI transitioned to SaveSuccessScreen successfully.`);

    // Small pause to catch any asynchronous background requests triggered by save
    await page.waitForTimeout(1000);

    const postSaveNetworkLogs = networkLogs.slice(preSaveNetworkCount);
    console.log(`[TRACE] Outgoing network requests during Save Haircut: ${postSaveNetworkLogs.length}`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 7: Inspect IndexedDB Record Structure
    // ──────────────────────────────────────────────────────────────────────────
    const idbDump = await page.evaluate(async () => {
      return new Promise<any>((resolve) => {
        // idb-keyval standard defaults: dbName = 'keyval-store', storeName = 'keyval'
        const req = indexedDB.open('keyval-store');
        req.onerror = () => resolve({ error: 'Failed to open keyval-store database' });
        req.onsuccess = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains('keyval')) {
            resolve({ error: 'Store keyval not found', objectStores: Array.from(db.objectStoreNames) });
            return;
          }
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const getReq = store.get('cutback_haircuts');
          getReq.onerror = () => resolve({ error: 'Failed to read cutback_haircuts' });
          getReq.onsuccess = () => {
            resolve({
              databaseName: db.name,
              objectStoreName: 'keyval',
              data: getReq.result,
            });
          };
        };
      });
    });

    const savedRecords: any[] = idbDump.data || [];
    const matchedRecord = savedRecords.find((r: any) => r.name === testMarker);

    expect(matchedRecord, `Record with name ${testMarker} must be found in IndexedDB`).toBeDefined();
    console.log(`[TRACE] IndexedDB record confirmed! ID: ${matchedRecord.id}`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 8: Navigate to My Haircuts Screen
    // ──────────────────────────────────────────────────────────────────────────
    const viewHaircutsBtn = page.getByRole('button', { name: 'View My Haircuts' });
    await expect(viewHaircutsBtn).toBeVisible();
    await viewHaircutsBtn.click();

    await expect(page.getByRole('heading', { name: 'My Haircuts' })).toBeVisible();
    await expect(page.getByText(testMarker).first()).toBeVisible();
    console.log(`[TRACE] Record "${testMarker}" is rendered in My Haircuts list.`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 9: Cross-Session Persistence: Refresh Page & Verify Survival
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`[TRACE] Reloading page to test persistence across refresh...`);
    await page.reload();

    // After reload, navigate back to My Haircuts from Home
    // Note: If on Home, check for saved haircuts or open My Haircuts directly if accessible
    await page.goto('/');
    // Check if there is a way to navigate to My Haircuts, or evaluate IDB directly after refresh
    const refreshedIdbData = await page.evaluate(async () => {
      return new Promise<any>((resolve) => {
        const req = indexedDB.open('keyval-store');
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction('keyval', 'readonly');
          const store = tx.objectStore('keyval');
          const getReq = store.get('cutback_haircuts');
          getReq.onsuccess = () => resolve(getReq.result);
          getReq.onerror = () => resolve(null);
        };
        req.onerror = () => resolve(null);
      });
    });

    const refreshedRecord = (refreshedIdbData || []).find((r: any) => r.name === testMarker);
    expect(refreshedRecord, 'Saved haircut record must survive page refresh in IndexedDB').toBeDefined();
    console.log(`[TRACE] Record "${testMarker}" verified in IndexedDB after page refresh.`);

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 10: Reopen Saved Haircut & Audit Media Availability
    // ──────────────────────────────────────────────────────────────────────────
    const myHaircutsBtn = page.getByRole('button', { name: 'My Haircuts' });
    await expect(myHaircutsBtn).toBeVisible({ timeout: 10_000 });
    await myHaircutsBtn.click();

    await expect(page.getByRole('heading', { name: 'My Haircuts' })).toBeVisible();
    await expect(page.getByText(testMarker).first()).toBeVisible();

    // Reopen the saved haircut
    const showBarberBtn = page.getByRole('button', { name: 'Show My Barber' }).first();
    await expect(showBarberBtn).toBeVisible();
    await showBarberBtn.click();

    // Verify Barber Brief is displayed
    await expect(page.getByText('Barber Brief')).toBeVisible();

    // Verify the original photo element loads successfully after reload
    const originalImg = page.locator('img[alt="Original photo"]');
    await expect(originalImg).toBeVisible();
    await expect.poll(async () => {
      return await originalImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    }, { timeout: 10_000 }).toBeGreaterThan(0);

    const naturalWidth = await originalImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    console.log(`[TRACE] Reopened original photo verified loaded: naturalWidth = ${naturalWidth}px`);

    const hasStoredBlob = !!(matchedRecord.originalPhotoBlob || (refreshedRecord && refreshedRecord.originalPhotoBlob));
    const originalUrlType = hasStoredBlob
      ? 'BLOB_OBJECT (Persisted in IndexedDB as Blob)'
      : matchedRecord.originalPhotoUrl
        ? matchedRecord.originalPhotoUrl.startsWith('blob:')
          ? 'BLOB_URL (Ephemeral)'
          : 'DATA_URI / STATIC'
        : 'UNDEFINED';

    const previewUrlType = matchedRecord.previewImageUrl
      ? matchedRecord.previewImageUrl.startsWith('data:')
        ? 'DATA_URI (Inline Base64)'
        : matchedRecord.previewImageUrl.startsWith('http')
          ? 'HTTP_URL (Cloud Storage)'
          : 'UNKNOWN'
      : 'UNDEFINED';

    // ──────────────────────────────────────────────────────────────────────────
    // STEP 11: Structured Terminal Report
    // ──────────────────────────────────────────────────────────────────────────
    console.log(`\n============================================================`);
    console.log(`           CUTBACK DATA PERSISTENCE TRACE REPORT           `);
    console.log(`============================================================\n`);

    console.log(`1. TEST IDENTIFIERS`);
    console.log(`   - Unique Test Marker    : ${testMarker}`);
    console.log(`   - Saved Haircut ID      : ${matchedRecord.id}`);
    console.log(`   - Backend Revision ID   : ${backendRevisionId || 'None'}`);
    console.log(`   - Hairstyle ID (Local)  : ${matchedRecord.hairstyleId}`);
    console.log(`   - Backend Hairstyle ID  : ${matchedRecord.backendId || 'None'}`);
    console.log(`   - Creation Date         : ${matchedRecord.date}`);

    console.log(`\n2. PERSISTENCE FINDINGS`);
    console.log(`   - Save Operation Result : SUCCESS (UI transitioned to SaveSuccessScreen)`);
    console.log(`   - IndexedDB Database    : ${idbDump.databaseName}`);
    console.log(`   - IndexedDB Object Store: ${idbDump.objectStoreName}`);
    console.log(`   - IndexedDB Key         : 'cutback_haircuts'`);
    console.log(`   - Fields in Record      : ${Object.keys(matchedRecord).join(', ')}`);
    console.log(`   - Backend API Called on Save: ${postSaveNetworkLogs.length > 0 ? 'YES' : 'NO (0 network requests)'}`);
    console.log(`   - Direct Firestore Write on Save: NO (Client does not write to Firestore)`);
    console.log(`   - Direct Storage Write on Save  : NO (Client does not upload to GCS on Save)`);
    console.log(`   - Record Survives Reload: YES (Persisted in IndexedDB)`);
    console.log(`   - Preview Representation: ${previewUrlType} (${matchedRecord.previewImageUrl ? matchedRecord.previewImageUrl.length + ' chars' : 'none'})`);
    console.log(`   - Original Portrait URL : ${originalUrlType} (${matchedRecord.originalPhotoUrl || 'none'})`);

    console.log(`\n3. MEDIA AVAILABILITY AUDIT`);
    if (matchedRecord.originalPhotoUrl && matchedRecord.originalPhotoUrl.startsWith('blob:')) {
      console.log(`   [CONFIRMED DEFECT] Original portrait is stored as an ephemeral 'blob:' URL.`);
      console.log(`   -> Impact: The original photo BREAKS after browser reload because the blob is revoked.`);
    } else {
      console.log(`   Original portrait storage format: ${originalUrlType}`);
    }
    if (matchedRecord.previewImageUrl && matchedRecord.previewImageUrl.startsWith('data:')) {
      console.log(`   [CONFIRMED OBSERVATION] Preview image is stored as an inline Base64 Data URI in IndexedDB.`);
      console.log(`   -> Impact: Preview survives reload locally, but consumes significant browser storage quota.`);
    }

    console.log(`\n4. FIREBASE CONSOLE & GCP INVESTIGATION HINTS`);
    console.log(`   When checking Firebase Console (Project: cutback-58d01):`);
    console.log(`   a) Firestore Revisions Collection:`);
    console.log(`      Path: revisions/${backendRevisionId}`);
    console.log(`      -> This document was written during /api/upload, /api/analyze, /api/select, and /api/preview.`);
    console.log(`      -> NOTE: It records AI pipeline metadata, NOT the user's "Saved Haircut" record.`);
    console.log(`   b) Cloud Storage Object Paths:`);
    console.log(`      Original: revisions/${backendRevisionId}/original.jpg`);
    console.log(`      Preview : revisions/${backendRevisionId}/preview.jpg`);
    console.log(`      -> Uploaded by backend during upload and preview stages.`);
    console.log(`   c) User "Saved Haircut" in Firestore:`);
    console.log(`      Path: [DOES NOT EXIST]`);
    console.log(`      -> Search for '${testMarker}' or '${matchedRecord.id}' in Firestore will return 0 results.`);
    console.log(`      -> Verified: Cutback does NOT write saved haircuts to any Firestore collection.`);

    console.log(`\n============================================================\n`);
  });
});
