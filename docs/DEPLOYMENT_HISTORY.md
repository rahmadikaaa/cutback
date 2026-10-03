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
