# Cutback Deployment History

> **Deployment Logging Policy:**
> Every future deployment/redeployment must append a new entry to this file with date, project, service, revision, URLs, and verification status.

---

## Verified Deployments

### 1. Production Deployment — 2026-09-30

- **Date:** 2026-09-30
- **GCP Project:** `cutback-58d01`
- **Frontend URL:** https://cutback-58d01.web.app
- **Backend Service:** `cutback-backend`
- **Backend Region:** `asia-southeast2`
- **Backend Revision:** `cutback-backend-00003-9vr`
- **Backend URL:** https://cutback-backend-421494208552.asia-southeast2.run.app
- **Verification Details:**
  - **Backend Health:** `200 OK` (`/health` endpoint)
  - **Frontend Status:** `200 OK`
  - **Frontend → Backend Connectivity:** `PASS` (CORS & API Base URL verified)
- **Status:** **DEPLOYED & VERIFIED**

### 2. Production Redeployment — 2026-10-05

- **Date:** 2026-10-05
- **GCP Project:** `cutback-58d01`
- **Frontend URL:** https://cutback-58d01.web.app
- **Backend Service:** `cutback-backend`
- **Backend Region:** `asia-southeast2`
- **Backend Revision:** `cutback-backend-00004-p4x`
- **Backend URL:** https://cutback-backend-421494208552.asia-southeast2.run.app
- **Verification Details:**
  - **Backend Health:** `200 OK` (`/health` endpoint)
  - **Frontend Status:** `200 OK`
  - **Frontend → Backend Connectivity:** `PASS` (CORS & API Base URL verified)
- **Status:** **DEPLOYED & VERIFIED**

### 3. Production V2 Deployment — 2026-10-08

- **Date:** 2026-10-08
- **GCP Project:** `cutback-58d01`
- **Frontend URL:** https://cutback-58d01.web.app
- **Backend Service:** `cutback-backend`
- **Backend Region:** `asia-southeast2`
- **Backend Revision:** `cutback-backend-00005-7g6`
- **Backend URL:** https://cutback-backend-421494208552.asia-southeast2.run.app
- **Verification Details:**
  - **Backend Health:** `200 OK` (`/health` endpoint)
  - **Frontend Status:** `200 OK`
  - **Frontend → Backend Connectivity:** `PASS` (CORS & API Base URL verified)
- **Status:** **DEPLOYED & VERIFIED**

### 4. Production V2.1 Remediation Deployment — 2026-10-12

- **Date:** 2026-10-12
- **Release Identifier:** `commit-361d949` (Stabilize analysis concurrency, recommendation flow, and barber handoff)
- **GCP Project:** `cutback-58d01`
- **Frontend URL:** https://cutback-58d01.web.app
- **Backend Service:** `cutback-backend`
- **Backend Region:** `asia-southeast2`
- **Backend Revision:** `cutback-backend-00006-l29`
- **Backend URL:** https://cutback-backend-421494208552.asia-southeast2.run.app
- **Verification Details:**
  - **Frontend Status:** `200 OK` (Landing, hero headline, and interactive flow confirmed via Playwright)
  - **Backend Health:** `200 OK` (`/health` endpoint: `{"status":"ok","service":"cutback-backend","version":"1.0.0","environment":"production"}`)
  - **Frontend → Backend Connectivity:** `PASS` (CORS preflight returned HTTP 204 with `Access-Control-Allow-Origin: *`)
  - **API Contract Verification:** `PASS` (`/api/analyze` handles structured requests with valid JSON response)
  - **Status:** **DEPLOYED & VERIFIED**

### 5. Production V2.2 Persistent Original Photo Deployment — 2026-10-14

- **Date:** 2026-10-14
- **Release Identifier:** `commit-0be9853` (fix: preserve original photo when reopening saved haircuts)
- **GCP Project:** `cutback-58d01`
- **Frontend URL:** https://cutback-58d01.web.app
- **Deployed Component:** Firebase Hosting (`frontend/dist` only, 9 files)
- **Backend Service:** `cutback-backend` (unchanged, Cloud Run)
- **Backend Region:** `asia-southeast2`
- **Backend Revision:** `cutback-backend-00006-l29`
- **Backend URL:** https://cutback-backend-421494208552.asia-southeast2.run.app
- **Verification Details:**
  - **Frontend Status:** `200 OK` (HTTP 200, ETag `4b34fbd5...`, live bundle served from Firebase Hosting CDN)
  - **Backend Health:** `200 OK` (`/health` endpoint: `{"status":"ok","service":"cutback-backend","version":"1.0.0","environment":"production"}`)
  - **Frontend → Backend Connectivity:** `PASS` (CORS preflight returned HTTP 204 with `Access-Control-Allow-Origin: *`)
  - **Saved Haircut Persistence & Reload Verification:** `PASS` (Playwright trace confirmed `naturalWidth = 1536px` after full browser reload, Blob preserved in IndexedDB `keyval-store`, object URL safely managed)
  - **Representative User Flow:** `PASS` (Upload photo, consent, AI analysis, recommendations, and preview generation executed end-to-end)
- **Status:** **DEPLOYED & VERIFIED**
