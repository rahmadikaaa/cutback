# Cutback Playwright Product QA Kit

This is an additive QA suite for the existing Cutback repo. It is designed to distinguish technical flow success from product/AI quality that needs human review. It does not replace or overwrite the current `e2e/api.spec.ts` or `e2e/cutback-flow.spec.ts`.

## What it checks

- Backend health and the explicit AI diagnostic smoke endpoint.
- API chain: upload/consent → analysis schema → recommendations → select → preview.
- Browser journey: homepage → upload/consent → analysis → recommendations → select → preview.
- API timings, console/page errors, screenshots, JSON evidence.
- Optional large-image upload timing.
- Explicit `NEEDS_REVIEW` items for image-analysis accuracy, identity preservation, hairstyle match, and Barber Brief consistency. Automated HTTP assertions cannot prove these qualities.

## Add to existing project

Copy `e2e/product-quality.spec.ts` into the project's `e2e/` directory. The ground-truth example is a template only; do not claim AI accuracy until a reviewer has filled it using the source photo.

Check the actual `playwright.config.ts` and existing UI labels first. This spec expects the currently reported local URLs and labels. If the app's selectors or flow differ, update selectors to match the real UI; do not loosen assertions just to make tests pass.

## Run in PowerShell from the project root

```powershell
$env:FRONTEND_URL = "http://localhost:8443"
$env:BACKEND_URL = "http://localhost:3000"
npx playwright test e2e/product-quality.spec.ts --project=chromium --workers=1
```

Optional large-image test:

```powershell
$env:LARGE_TEST_PHOTO_PATH = "C:\path\to\large-consented-test-photo.jpg"
npx playwright test e2e/product-quality.spec.ts --project=chromium --workers=1
```

Use only a test photo you have permission to process. Large-photo test currently measures upload acceptance/latency; it does not call the full paid AI pipeline on the large file to avoid unexpected cost. If you want full-chain large-image testing, add an explicit opt-in and cost limit first.

## Evidence

The suite writes evidence under `test-results/cutback-qa/`:

- `01-home.png`, `02-upload-ready.png`, `03-analysis.png`, `04-recommendations.png`, `05-preview.png`
- JSON evidence per test with stage status, API responses/status/timing, console errors, page errors, photo size, and visual-review checklist
- `analysis-output.json` with structured analysis response (no source image bytes)

Playwright's normal HTML report is also available if the current config has an HTML reporter:

```powershell
npx playwright show-report
```

## Reporting semantics

- **PASS** = automated assertion proved the tested behavior.
- **FAIL** = an assertion failed or browser errors were detected.
- **NEEDS_REVIEW** = visual/semantic quality requires a human reviewer.
- **NOT_TESTED** = this build did not expose a detectable UI for that requirement.

The API-chain test requires preview route `SUCCESS` and a non-empty `previewImageUrl`; it intentionally does not treat an arbitrary HTTP 200 as a successful preview.
