# Cutback

**Your best haircut, remembered.** *(Biar ganteng konsisten.)*

Cutback is a mobile-first AI haircut companion that helps people discover a hairstyle suited to their unique facial structure, preview it realistically on themselves, communicate specifications directly to a barber in high-contrast presentation mode, and reopen that choice for future visits with zero recurring AI cost.

- **Target Alignment:** AI Builder Cup 2026 (Retail & Commerce: Intelligent Customer & Business Experiences)
- **Live Production Application:** [https://cutback-58d01.web.app](https://cutback-58d01.web.app)
- **Backend Service:** Google Cloud Run (`cutback-backend` in `asia-southeast2` Jakarta)
- **Figma Design Prototype (Reference):** [Open prototype](https://home-react-43945947.figma.site/)
- **Document Snapshot:** **October 2026 (Production Release V2.4, Verified)**

---

## 1. Executive Summary & Core Principle

Choosing a haircut often starts with vague instructions such as *"rapihin"* (tidy it up) or *"tipisin samping"* (thin the sides). Showing a celebrity photo creates unrealistic expectations because celebrity hair density, hairline, and facial proportions differ. When a haircut actually succeeds, clients lack a structured record to replicate it on their next visit.

Cutback bridges this gap into a guided **Transformation Journey**:
1. **Discover:** Multimodal AI analysis of facial shape and hair traits with transparent provenance.
2. **Personalize:** Grounded recommendations with clear feasibility ratings (`Ready Now` vs `Transition Required`).
3. **Preview:** Personal visual simulation where **"Identity stays. Hair transforms."** (face, skin tone, pose, expression, and background remain stable).
4. **Communicate:** Fullscreen, high-contrast **Barber Presentation Mode** designed for the barber chair.
5. **Remember:** Saved briefs persist locally in IndexedDB with full photo Blobs, reopening instantly with **0 AI tokens and 0 server latency**.

---

## 2. Production Architecture & Google Cloud Stack

Cutback's architecture is deployed, active, and verified in production:

```text
[ Mobile Client (PWA) ]
  ├── React 19 + TypeScript + Vite + Tailwind CSS (Hosted on Firebase Hosting)
  ├── On-Device Vision: Google MediaPipe Vision Tasks (FaceDetector)
  ├── Interactive Compare: Touch/Pointer "Hold to Compare" crossfade
  ├── Barber Handoff: Barber Presentation Mode (fullscreen high-contrast modal)
  └── Local Storage: IndexedDB (idb-keyval) with raw portrait Blob preservation
              │
              ▼ HTTPS (REST / CORS enabled)
[ Google Cloud Run: cutback-backend ]
  ├── Region: asia-southeast2 (Jakarta)
  ├── Container: Node.js 20 + Express + Google Genkit runtime
  ├── Concurrency Lock: In-flight promise caching & state locking
  ├── Session Hydration: Google Cloud Firestore (Native Mode)
  └── Model Orchestration (Google Gemini via Genkit):
        ├── gemini-3.5-flash        -> Photo Analysis & Evidence Extraction
        ├── gemini-3.5-flash        -> Grounded Recommendations & Barber Brief
        ├── gemini-3.1-flash-image  -> Visual Hairstyle Simulation Preview
        └── gemini-2.5-flash        -> Diagnostic Smoke Test (/diagnostic/smoke)
```

### Key Engineering Principles
- **Predictable work goes in functions; reasoning goes in the model:** MIME checks, consent gates, schema validation, quota, and state routing are deterministic functions. Gemini handles multimodal reasoning.
- **Evidence-Aware Provenance:** Every analyzed trait is tagged with its origin (`Observed`, `Inferred`, `User-provided`, `Unknown`) to eliminate hallucinated measurements.
- **Human-in-the-Loop Boundary:** Hairstyle selection is an explicit user choice (`/api/select`, 0 AI tokens). Image generation is invoked only for the chosen look.
- **Zero Credential Exposure:** Server-side `GEMINI_API_KEY` injection on Cloud Run; zero API keys or secrets in client bundles.

---

## 3. Verified End-to-End User Journey

The 9-step user flow is verified in production without mock fallbacks:

```text
[1. HomeScreen]
   └─ Clean editorial hero layout; primary CTA: "Make It Real"
[2. Upload & Consent]
   └─ Camera/gallery upload (JPEG/PNG/WebP <= 10MB); explicit checkbox consent required
   └─ MediaPipe client-side face boundary normalization
[3. AI Analysis (gemini-3.5-flash)]
   └─ Single human & face/hair visibility validation
   └─ Multi-attribute extraction with provenance: Observed, Inferred, User-provided, Unknown
[4. Unified Preferences (Optional)]
   └─ Vibe, relative length (Shorter/Keep/Longer), effort (Low/Med/High), free-text note (<=500 chars)
[5. Grounded Recommendations (gemini-3.5-flash)]
   └─ Up to 3 distinct hairstyles with Best Match rationale
   └─ Feasibility rating: Ready Now | Possible with Adjustment | Transition Required | Not Realistic
   └─ Evidence links tying recommendations to observed traits
[6. Hairstyle Selection (/api/select)]
   └─ Explicit single hairstyle selection (deterministic state update, 0 AI tokens)
[7. Personalized Preview (gemini-3.1-flash-image)]
   └─ Triggered ONLY on user tap ("Try This Look — Preview on Me")
   └─ Identity preservation prompt; auto-switch to "Hold to Compare" crossfade mode
[8. Structured Barber Brief & Presentation Mode]
   └─ Structured specifications: Top, Sides, Back, Fringe, Styling, Maintenance, Avoid
   └─ Primary CTA "Show My Barber" launches fullscreen Barber Presentation Mode modal
[9. Save & Zero-AI Repeat (IndexedDB)]
   └─ Saves full brief snapshot + original photo Blob into IndexedDB (cutback_haircuts)
   └─ Reopen ("Show My Barber" or "Repeat This Cut") consumes exactly 0 AI calls / 0 tokens
   └─ Reopening saved brief locks back navigation to prevent accidental flow resets
```

---

## 4. Verified Feature & Evidence Matrix

| Feature / Behavior | Implementation Evidence | Test / Production Verification | Status |
| :--- | :--- | :--- | :---: |
| **Photo Upload & 10MB Limit** | Multer buffer limit in `app.ts`, format check in `upload.ts` | Unit: `upload.test.ts` (PASS); E2E: `api.spec.ts` | `Verified` |
| **Consent Enforcement** | `UploadScreen` in `App.tsx`; backend requires `consent: true` | `e2e/cutback-flow.spec.ts` (zero bytes sent prior to consent) | `Verified` |
| **On-Device Face Normalization** | MediaPipe `@mediapipe/tasks-vision` in `App.tsx` | Browser E2E suite; graceful fallback on uncropped image | `Verified` |
| **Evidence-Aware AI Analysis** | `AnalysisSchema` with `ProvenanceSchema` in `analysis.ts` | Unit: `analysis.test.ts`; E2E: `phase2-recommendation-provenance.spec.ts` | `Verified` |
| **Concurrency & StrictMode Lock** | In-flight promise caching & status lock in `analysis.ts` (DEF-001) | Unit: `hydration.test.ts`; Dev trace logs (zero duplicate AI calls) | `Verified` |
| **Feasibility & Provenance Recs** | `RecommendationSchema` in `recommendation.ts` | Unit: `recommendation.test.ts` (100% pass across 15 tests) | `Verified` |
| **AI Preview Generation** | `previewFlow` calling `gemini-3.1-flash-image` in `preview.ts` | Unit: `preview.test.ts`; Live Cloud Run execution (200 OK) | `Verified` |
| **Hold to Compare Crossfade** | `previewMode` state & pointer events in `App.tsx` (DEF-002) | Automated Playwright inspection & manual pointer test | `Verified` |
| **Barber Presentation Mode** | Fullscreen modal (`setPresentationMode`) in `App.tsx` (DEF-003) | Live Playwright production check & visual inspection | `Verified` |
| **Streamlined Brief & Hero** | Removal of drawer, hidden notes UI, Back to Home (commit `8beb3bd`) | `tools/verify_production.cjs` on `cutback-58d01.web.app` (PASS) | `Verified` |
| **IndexedDB Blob Persistence** | `idb-keyval` storing `originalPhotoBlob` in `App.tsx` | `save-haircut-persistence.spec.ts` (naturalWidth=1536px after reload) | `Verified` |
| **Cloud Firestore Hydration** | `getOrHydrateRevision` in `firestoreDb.ts` | `backend/tests/hydration.test.ts`; `/health/firestore` (PASS) | `Verified` |
| **Zero-AI Reopen & Repeat** | `onReopenBrief` / `onRepeat` reading from IndexedDB | `e2e/save-haircut-persistence.spec.ts` (0 provider requests) | `Verified` |

---

## 5. Repository Structure

```text
cutback/
├── backend/                   # Node.js 20 Express + Genkit API server
│   ├── src/
│   │   ├── flows/             # Genkit flows (analysis, recommendation, preview)
│   │   ├── schemas/           # Zod contracts & provenance schemas
│   │   ├── services/          # Firestore hydration & storage adapters
│   │   └── app.ts             # Server entrypoint & middleware
│   └── tests/                 # Unit & integration test suites
├── frontend/                  # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/        # Screens (Home, Upload, Analysis, Preview, Brief)
│   │   ├── services/          # API client & IndexedDB storage helpers
│   │   └── App.tsx            # Main application coordinator
├── docs/                      # Canonical documentation & deployment logs
│   ├── FACT_SHEET.md          # Canonical submission fact sheet & pitch baseline
│   └── DEPLOYMENT_HISTORY.md  # Production deployment audit trail
├── e2e/                       # Playwright end-to-end test suite
├── specs/                     # Canonical engineering specifications
│   ├── prd.md                 # Product requirements document
│   ├── requirements.md        # Technical requirements & acceptance criteria
│   ├── design.md              # Architecture design document
│   └── tasks.md               # Implementation task tracker
└── cutback.sh                 # Local service manager script (Git Bash)
```

---

## 6. Local Development Setup

### Prerequisites
- Node.js 20+ LTS
- npm 10+
- Google Gemini API Key (for local AI calls)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and supply your GEMINI_API_KEY
npm run dev
```
By default, the backend runs on `http://localhost:3000`.

### Frontend Setup
```bash
cd frontend
npm install
# Optional: create .env if custom backend URL is needed
# VITE_API_BASE_URL=http://localhost:3000
npm run dev
```
The frontend dev server runs on `http://localhost:8080` (or Vite default `http://localhost:5173`).

### Using `cutback.sh` (Windows Git Bash)
A management script is provided in the repository root to start, stop, restart, and inspect background services:
```bash
./cutback.sh
```
This interactive script controls the Backend (port 3000) and Frontend (port 8080).

---

## 7. AI Builder Cup Alignment (Retail & Commerce)

Cutback is purpose-built for the **Retail & Commerce: Intelligent Customer & Business Experiences** track.

### 1. Grounded Discovery Over Generic Models
Instead of displaying stock model photos, Cutback analyzes the customer's actual facial shape, hairline, and hair texture, explaining why certain cuts work.

### 2. Physical Feasibility Guardrails
Haircuts are tagged with realistic readiness (`Ready Now` vs `Transition Required`), preventing premature cuts when hair growth is required.

### 3. The In-Person Barber Bridge
Barbers do not want to navigate consumer AI apps during a haircut. Cutback provides **Barber Presentation Mode**: a high-contrast, fullscreen digital brief with clipper guard numbers, taper heights, and texture notes ready to hand over.

### 4. Zero-AI Cost Repeatability
Haircut briefs are stored with full photo Blobs in the user's browser IndexedDB. Future visits reload the exact brief instantly with zero API requests, zero latency, and zero token costs.

---

## 8. Limitations & Scope Boundaries

### Known Limitations
- **Generative Simulation:** Generated previews are realistic visual estimates, not a 100% physical guarantee of barber scissor execution.
- **Identity Preservation Boundary:** Multimodal models closely approximate facial identity and framing; minor boundary artifacts around fine hair strands may occur.
- **Single-Device Local Storage:** In MVP V2.4, saved haircuts persist in IndexedDB. Clearing browser site data clears saved cuts unless backed up.
- **Frontal / 3/4 Portrait Focus:** Best suited for clear frontal selfies; full 360-degree rotational 3D head modeling is outside MVP scope.

### Explicit Non-Goals (MVP)
- Barber scheduling, calendar booking, or payment processing.
- Barber CRM / back-office dashboard.
- Live WebGL / WebXR augmented reality face filters.
- Training proprietary foundational models.

---

## 9. Specification-Driven Development

Cutback follows strict specification-driven development:

```text
PRD → Requirements → Design → Tasks → Code → Acceptance Tests → Status Update
```

- Canonical specs reside in `specs/` (`prd.md`, `requirements.md`, `design.md`, `tasks.md`).
- Fact sheet & pitch baseline: `docs/FACT_SHEET.md`.
- Deployment history: `docs/DEPLOYMENT_HISTORY.md`.
- Files under `docs/archive/` are historical references only.
