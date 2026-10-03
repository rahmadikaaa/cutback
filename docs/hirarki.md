Listed directory cutback
Listed directory specs
Listed directory frontend
Listed directory src
Listed directory assets
Listed directory imports
Listed directory backend
Listed directory src
Listed directory tests
Listed directory tests
Listed directory design
Listed directory references
Listed directory docs
Searched for "function "
Searched for "const "
Viewed App.tsx:1-100
Viewed App.tsx:100-300
Searched for "function "
Ran command: `Select-String -Path "frontend/src/App.tsx" -Pattern "^function " | Select-Object -ExpandProperty Line`
Ran command: `Select-String -Path "frontend/src/App.tsx" -Pattern "export (default )?function" | Select-Object -ExpandProperty Line`
Ran command: `Select-String -Path "frontend/src/App.tsx" -Pattern "function HomeScreen" -Context 0,40`
Ran command: `Select-String -Path "frontend/src/App.tsx" -Pattern "function HomeScreen" -Context 40,80`
Viewed App.tsx:430-520
Ran command: `Select-String -Path "specs/design.md" -Pattern "^#+ " | Select-Object -ExpandProperty Line`
Viewed app.ts:1-39
Viewed cutback.sh:1-60
Viewed api.ts:1-60
Viewed recommendation.ts:1-60
Viewed preview.ts:1-60
Viewed analysis.ts:1-60

```
cutback/
├── specs/
│   ├── [cutback-prdv2.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/cutback-prdv2.md)
│   ├── [cutback-requirements-v0.5(4).md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/cutback-requirements-v0.5(4).md)
│   ├── [cutback-tasks-v0.3.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/cutback-tasks-v0.3.md)
│   ├── [cutback-tasks-v0.4.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/cutback-tasks-v0.4.md)
│   ├── [design.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/design.md)
│   ├── [prd.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/prd.md)
│   ├── [requirements.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/requirements.md)
│   └── [tasks.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/specs/tasks.md)
│
├── frontend/
│   ├── src/
│   │   ├── [main.tsx](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/main.tsx) (React root mounting)
│   │   ├── [index.css](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/index.css) (Design tokens & core styles)
│   │   ├── [api.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/api.ts) (API client & schema mappings)
│   │   │   ├── uploadPhoto()
│   │   │   ├── analyzePhoto()
│   │   │   ├── fetchRecommendations()
│   │   │   ├── selectHairstyle()
│   │   │   └── generatePreview()
│   │   ├── [App.tsx](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/App.tsx) (State router & consolidated screens)
│   │   │   ├── Shared UI Components
│   │   │   │   ├── SimBadge
│   │   │   │   ├── BackBtn
│   │   │   │   ├── ProgressDots
│   │   │   │   ├── PrimaryBtn
│   │   │   │   ├── GhostBtn
│   │   │   │   ├── ConvergeChain
│   │   │   │   └── formatAttrValue
│   │   │   └── Screen Components
│   │   │       ├── HomeScreen
│   │   │       ├── UploadScreen (MediaPipe FaceDetector + WebCam/File)
│   │   │       ├── AnalysisLoadingScreen
│   │   │       ├── AnalysisFailureScreen
│   │   │       ├── AnalysisResultsScreen
│   │   │       ├── PreferencesScreen
│   │   │       ├── RecommendationsScreen
│   │   │       ├── PreviewLoadingScreen
│   │   │       ├── PreviewFailureScreen
│   │   │       ├── PreviewScreen
│   │   │       ├── BarberBriefScreen
│   │   │       ├── SaveScreen
│   │   │       ├── SaveSuccessScreen
│   │   │       ├── SaveFailureScreen
│   │   │       └── MyHaircutsScreen
│   │   ├── [assets/](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/assets)
│   │   │   ├── portrait-1.jpg
│   │   │   ├── portrait-2.png
│   │   │   ├── portrait-3.png
│   │   │   └── attachment-1 ... attachment-6
│   │   └── [imports/](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/imports) (Design assets & historical specs)
│   │       ├── Low_taper_volume_haircut_portrait.png
│   │       ├── Textured_Quiff_Portrait_on_Navy.png
│   │       └── 1000365803_1_.jpg
│   ├── [index.html](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/index.html)
│   ├── [package.json](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/package.json)
│   ├── [tsconfig.json](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/tsconfig.json)
│   ├── [vite.config.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/vite.config.ts)
│   └── tests/ [NOT FOUND] (No frontend unit / E2E test files exist)
│
├── backend/
│   ├── src/
│   │   ├── [server.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/server.ts) (HTTP listener on port 3000/3001)
│   │   ├── [app.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/app.ts) (Express app & route dispatch)
│   │   ├── [health.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/health.ts) (GET /health)
│   │   ├── [smoke.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/smoke.ts) (POST /diagnostic/smoke)
│   │   ├── [upload.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/upload.ts) (POST /api/upload - Multer)
│   │   ├── [analysis.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/analysis.ts) (POST /api/analyze - Genkit + Gemini Flash)
│   │   ├── [recommendation.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/recommendation.ts) (POST /api/recommendations & /api/select - Genkit + Gemini Flash)
│   │   ├── [preview.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/preview.ts) (POST /api/preview - Genkit + Imagen 3 / Gemini)
│   │   ├── [firestoreDb.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/firestoreDb.ts) (Firestore session persistence)
│   │   ├── [cloudStorage.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/cloudStorage.ts) (GCS bucket upload / signed URLs)
│   │   ├── [firebase.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/firebase.ts) (Firebase Admin SDK config)
│   │   └── [state.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/src/state.ts) (In-memory revision state store)
│   ├── tests/
│   │   ├── [health.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/health.test.ts)
│   │   ├── [smoke.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/smoke.test.ts)
│   │   ├── [upload.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/upload.test.ts)
│   │   ├── [analysis.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/analysis.test.ts)
│   │   ├── [recommendation.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/recommendation.test.ts)
│   │   └── [preview.test.ts](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tests/preview.test.ts)
│   ├── [package.json](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/package.json)
│   ├── [tsconfig.json](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/tsconfig.json)
│   ├── [jest.config.js](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/jest.config.js)
│   └── [Dockerfile](file:///c:/Users/rahma/OneDrive/Documents/cutback/backend/Dockerfile)
│
├── design/
│   ├── [handoff-figma.md](file:///c:/Users/rahma/OneDrive/Documents/cutback/design/handoff-figma.md)
│   ├── [wireframe.png](file:///c:/Users/rahma/OneDrive/Documents/cutback/design/wireframe.png)
│   └── references/ (Visual benchmarks & source photos)
│       ├── original.jpg
│       ├── 1000365803.jpg
│       ├── Low taper volume haircut portrait.png
│       └── Textured Quiff Portrait on Navy.png
│
├── config & scripts/
│   ├── [cutback.sh](file:///c:/Users/rahma/OneDrive/Documents/cutback/cutback.sh) (Local process supervisor)
│   ├── [firebase.json](file:///c:/Users/rahma/OneDrive/Documents/cutback/firebase.json)
│   └── [.firebaserc](file:///c:/Users/rahma/OneDrive/Documents/cutback/.firebaserc)
│
└── tests/ (Root folder is empty)
```

---

### Mapped Navigation & Experience Hierarchy

```
HomeScreen (frontend/src/App.tsx)
├── Hero
│   ├── Dynamic Headline: "A [sharper / bolder / cleaner] you."
│   ├── Tagline: "Identity stays. Hair transforms."
│   └── Brand Header: "Cutback"
│
├── Make It Real (Action Button)
│   └── Navigates to Journey Step 01 (Upload)
│
├── My Haircuts (Ghost Button)
│   └── Navigates to MyHaircutsScreen (Saved haircuts in IDB/Firestore)
│
└── Journey (Collapsible Sidebar Rail)
    ├── 01 Discover (Upload & Analyse)
    │   ├── UploadScreen (Photo capture / upload + MediaPipe face detection)
    │   ├── AnalysisLoadingScreen (4-step staged feedback)
    │   ├── AnalysisFailureScreen (Recovery options & re-upload)
    │   └── AnalysisResultsScreen (Feature verification: shape, length, type, texture)
    │
    ├── 02 Find Cut / Define (Recommend)
    │   ├── PreferencesScreen (Vibe, Length, Styling Effort, Notes)
    │   └── RecommendationsScreen (3 AI recommendations, Best Match, Hold-to-Compare modal)
    │       └── ConvergeChain (Evidence linking attributes + intent → haircut)
    │
    ├── 03 Preview / Visualize (Preview)
    │   ├── PreviewLoadingScreen (Progressive loading feedback)
    │   ├── PreviewFailureScreen (Retry & fallback options)
    │   └── PreviewScreen (Personalized photo preview, compare slider, top/sides/back/fade breakdown)
    │
    └── 04 Ready (Brief & Save)
        ├── BarberBriefScreen (Actionable barber instructions & shareable card)
        ├── SaveScreen (Custom name input & local/cloud save)
        ├── SaveSuccessScreen (Confirmation & shortcut to My Haircuts)
        ├── SaveFailureScreen (Offline/sync error recovery)
        └── MyHaircutsScreen (Library of saved cuts with brief inspection & deletion)
```

---

### Features Mentioned in `design.md` Audited Against Codebase

| Design Feature / Concept | Codebase Status | Actual Location / Note |
| :--- | :--- | :--- |
| **Separate Screen Component Files** | **[NOT FOUND]** | Consolidated into monolithic [frontend/src/App.tsx](file:///c:/Users/rahma/OneDrive/Documents/cutback/frontend/src/App.tsx) |
| **Frontend Automated Unit/E2E Tests** | **[NOT FOUND]** | No test runner configured in `frontend/` (only backend has Jest) |
| **Graphify / Hair Knowledge Graph Database** | **[NOT FOUND]** | Recommendations use in-prompt Gemini generation & static fallbacks |
| **Real-Time AR 3D Face Mesh Tracking** | **[NOT FOUND]** | Uses 2D `@mediapipe/tasks-vision` `FaceDetector` bounding box / quality check |
| **360° / Multi-Angle 3D Hairstyle Mesh** | **[NOT FOUND]** | Uses 2D portrait synthesis via Imagen 3 / Gemini |
| **Reality Loop (Barber Barcode / 2-Way Scanner)** | **[NOT FOUND]** | Marked as post-MVP concept in specs; no endpoint or scanner exists |