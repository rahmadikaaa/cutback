# Cutback

**Your best haircut, remembered.**

Cutback is a mobile-first AI haircut companion that helps people discover a hairstyle, preview it on themselves, communicate their choice to a barber, and reopen that choice for a future visit.

**Current milestone: implementation preparation with a working UI prototype and Graph Engineering baseline.** The product journey is already represented from photo selection to a saved-haircut screen, while the next implementation phase is to connect that experience to a real Google ADK graph and real Google AI responses. Real personalized AI processing, durable storage, and the complete end-to-end MVP are not yet claimed as verified.

[Open the prototype](https://home-react-43945947.figma.site/)

Status snapshot: **24 September 2026**. This README documents the current product prototype, repository baseline, and intended implementation direction. It is not a claim that every runtime integration, test, or deployment has already passed.

## Source of truth

The active implementation baseline lives under `specs/`:

- `specs/prd.md` — product intent, priorities, and success direction.
- `specs/requirements.md` — required behavior and acceptance criteria.
- `specs/design.md` — technical implementation design.
- `specs/tasks.md` — execution order and implementation gates.

Files under `docs/archive/` are **historical references only** and must not be used as the current implementation baseline.

If an archived document conflicts with a canonical file in `specs/`, the canonical file wins.

## Repository structure

```text
cutback/
├─ README.md
├─ backend/
├─ design/
│  ├─ handoff-figma.md
│  ├─ references/
│  └─ wireframe.png
├─ docs/
│  ├─ archive/
│  └─ session-reports/
├─ frontend/
├─ knowledge/
│  └─ hairstyle/
│     └─ v1/
├─ specs/
│  ├─ design.md
│  ├─ prd.md
│  ├─ requirements.md
│  └─ tasks.md
└─ tests/
```

Folder responsibilities:

- `frontend/` — application UI implementation.
- `backend/` — API, Google ADK graph orchestration, server-side validation, and integrations.
- `design/` — Figma handoff, wireframes, and visual references.
- `knowledge/` — structured hairstyle knowledge used by the product.
- `specs/` — canonical product and engineering specifications.
- `tests/` — automated tests and acceptance evidence.
- `docs/` — session reports and archived historical documents.

## Why Cutback

Choosing a haircut often starts with vague instructions such as “tidy it up” or “make it thinner.” A reference photo can help, but it does not show how that style might look on the person using it. Even a successful haircut can be difficult to repeat without a record of the details.

Cutback brings those steps together:

- **Discover:** understand visible hair characteristics and explore suitable styles.
- **Preview:** compare the original photo with a simulation of the selected style.
- **Communicate:** take a structured brief to the barber.
- **Repeat:** reopen a saved brief witho ut starting the process again.

The initial audience is men who want help choosing and repeating a haircut. Barbers receive the brief; a barber account or dashboard is outside the current MVP scope.

## Current prototype

The prototype was created with Figma Make. Its visual direction uses dark navy, gold accents, editorial typography, and prominent portraits.

The preview concept is **“Identity stays. Hair transforms.”** Hair changes should preserve the person's face, pose, framing, and background as closely as possible. This is a design target, not a verified guarantee from an integrated image model.

| Area | Demonstrated state | Remaining verification or implementation |
| --- | --- | --- |
| Landing | Find My Haircut and My Haircuts entry points | Navigation and mobile behavior in production code |
| Photo input | Photo guide, sample selection, own-photo action, and consent UI | Real upload handling and input validation |
| Analysis | Simulated observations, including an Unknown attribute state | Real photo analysis and schema validation |
| Preferences | Optional vibe, length, styling effort, and notes | Preferences influencing real recommendations |
| Recommendations | Style name, rationale, effort, trade-offs, and selection controls | Personalization from the user's actual input |
| Preview | Original/Possible controls and simulated hairstyle imagery | Personal image generation and recovery behavior |
| Barber Brief | Original/simulation comparison, cut details, notes, and confirmation prompts | Consistency with real analysis and selected style |
| Save and My Haircuts | Save confirmation, saved card, open/repeat/delete controls | Durable persistence after refresh, reopening, and deletion |

Visible controls and screenshots do not establish that every interaction works. Labels such as **Simulated AI Analysis** and **Simulated AI Preview** describe the current demo behavior.

## Product flow

1. Upload or select a photo and provide consent.
2. Validate the photo before analysis.
3. Analyze visible face and hair characteristics; leave uncertain attributes unknown.
4. Optionally provide preferences, then view recommendations.
5. Choose one hairstyle.
6. Request a personal preview for that selection.
7. Review the barber brief and add notes.
8. Save the haircut and reopen its brief from My Haircuts.

Preferences remain optional. Preview generation is intended for the selected style, not every recommendation automatically. Reopening a saved brief should not require a new AI call. If preview generation fails, the user should still be able to continue to a text brief.

## Try the prototype

Open the prototype link, select **Find My Haircut**, and use a sample photo to explore the demonstrated journey. Review the analysis screen, skip or set preferences, choose a style, compare preview states, and continue to the brief. Explore Save and My Haircuts to review the intended return experience.

Sample imagery and simulated observations illustrate the experience. They are not evidence that an arbitrary uploaded photo receives personalized AI output. A save confirmation alone does not establish durable persistence.

## Technical direction

Cutback is moving toward **graph-based orchestration with Google ADK** on Google Cloud.

The core engineering principle is:

> Predictable work goes in functions; reasoning goes in the model.

The graph should make runtime orchestration explicit: which node runs first, which decisions branch, which work is deterministic, where Gemini is required, where the user makes a decision, and how failures or stale results are handled.

Planned node responsibilities include:

- **Function nodes** — file validation, consent checks, schema validation, quota checks, brief formatting, revision checks, persistence helpers.
- **Reasoning nodes** — multimodal hair analysis and grounded hairstyle recommendation using Gemini.
- **Deterministic routers** — closed-set decisions such as valid/invalid, quota available/unavailable, preview success/failure.
- **Human-in-the-loop** — the user selects the hairstyle; the model does not make the final haircut decision autonomously.
- **Image generation** — generate a preview only for the selected hairstyle.
- **Optional fan-out/join** — used only where parallel work is genuinely useful and supported cleanly by the selected ADK runtime/API.

Intended runtime flow:

```text
Frontend / Figma-derived UI
          ↓
     Application API
          ↓
    Google ADK Graph
          ↓
 ┌───────────────────────┐
 │ Deterministic Nodes   │
 │ validation            │
 │ routing               │
 │ schema checks         │
 │ quota/revision        │
 │ persistence           │
 └──────────┬────────────┘
            │
            ├──────────────► Gemini reasoning nodes
            │
            └──────────────► image generation when requested
```

| Layer | Current direction |
| --- | --- |
| UI | Figma Make prototype; production implementation belongs in `frontend/` |
| Application API | Server-side validation, business rules, access checks, quota, revision consistency, and storage integration |
| AI orchestration | Google ADK graph, planned baseline |
| Reasoning | Gemini for multimodal analysis and recommendation reasoning |
| Deterministic work | Regular application functions and routers, not LLM calls |
| Analysis/image models | Exact models and configuration must be locked in `specs/design.md` before implementation |
| Storage | Photo storage, saved-haircut persistence, and guest/account strategy must be locked before persistence work |
| Deployment | Google Cloud target; exact production topology must be documented and verified |
| Observability | Request/job IDs, route/node status, latency, model usage, and cost-relevant metadata without private photos or notes |

ADK is the orchestration layer; it does not replace the application API's responsibilities for validation, permissions, quotas, consistency, or privacy.

## Development workflow

Cutback follows specification-driven development.

```text
PRD
 ↓
Requirements
 ↓
Design
 ↓
Tasks
 ↓
Code
 ↓
Tests / acceptance evidence
```

For the current repository:

1. Read `README.md`.
2. Read all four canonical files under `specs/`.
3. Execute the current task/gate from `specs/tasks.md` only.
4. Do not use `docs/archive/` as implementation requirements.
5. Do not implement later tasks until their dependencies and gates are satisfied.
6. If implementation requires a product or architecture decision that is not defined in the canonical specs, mark the task **BLOCKED** instead of guessing.
7. After each task, record files changed, tests run, acceptance evidence, and remaining blockers.

When behavior changes, update the relevant requirements, design, tasks/tests before merge. Manual code edits are allowed only if the specifications remain synchronized with the implemented behavior.

## Local development

The repository structure is now established, but exact install/build/test commands must come from the actual frontend/backend project configuration once those implementations are scaffolded and verified.

Before treating a component as developer-ready:

1. Document the actual framework/runtime/package manager used by that component.
2. Document exact installation, development, build, and test commands from repository configuration.
3. Add environment examples containing variable names and safe placeholders only.
4. Verify instructions from a fresh checkout.
5. Document selected AI models, deployment services, and storage behavior as they are implemented.

Do not document unverified commands as working setup instructions.

### Manual Setup

**Backend**
`ash
cd backend
npm install
npm run dev
`
By default, the backend runs on port 3000.

**Frontend**
`ash
cd frontend
npm install
# Create a .env file with backend URL if not localhost:3000
# VITE_API_BASE_URL=http://localhost:3000
npm run dev
`
By default, the frontend runs and connects to localhost:3000.

### Using `cutback.sh`
To quickly manage the frontend and backend locally in Windows Git Bash, a manager script is provided in the root directory:
```bash
./cutback.sh
```
This script opens an interactive menu to start (`ON`), stop (`OFF`), restart, and manage ports for the local services (Backend on 3000, Frontend on 8080) running in the background.

## Next milestone: executable graph vertical slice

The immediate goal is not to implement every MVP capability at once. The next milestone is to prove one real graph-orchestrated AI slice:

```text
Cutback UI
  ↓
Deterministic photo validation
  ↓
Consent gate
  ↓
Google ADK graph
  ↓
Gemini analysis node
  ↓
Deterministic schema validation
  ↓
Structured analysis returned to UI
```

Minimum success conditions:

- [ ] Canonical technical decisions required by the current T0 gate are locked.
- [ ] Backend/API foundation runs locally.
- [ ] An executable ADK graph is demonstrated.
- [ ] At least one real Google AI/Gemini request succeeds intentionally.
- [ ] Photo validation and consent happen before paid AI processing.
- [ ] AI output is validated against the expected schema before UI use.
- [ ] Unknown attributes remain explicit rather than being invented.
- [ ] Error/retry behavior is observable and controlled.
- [ ] Node/route execution can be traced with request/job IDs without logging private images or notes.

A stronger vertical slice continues through grounded recommendations and user hairstyle selection.

## Functional MVP target

After the graph foundation is proven, the MVP target remains one complete journey using a user's own photo, real AI responses, and a saved brief that can be reopened.

- [ ] Validate photo input and consent before AI processing.
- [ ] Produce structured analysis and personalized recommendations.
- [ ] Keep preferences optional.
- [ ] Generate a preview only for the selected hairstyle.
- [ ] Keep the selected style, preview, and brief consistent by revision.
- [ ] Allow a brief to continue when preview generation fails.
- [ ] Save, refresh, reopen, repeat, and delete a haircut successfully.
- [ ] Ensure Repeat This Cut does not require a new AI call.
- [ ] Handle invalid input, analysis failure, preview failure, stale results, quota exhaustion, and failed saves.
- [ ] Prevent duplicate paid requests and enforce server-side limits.
- [ ] Test the full journey on mobile starting at 360 px without horizontal scrolling.
- [ ] Verify touch targets of at least 44 × 44 px and readable text contrast.
- [ ] Deploy and test the functional flow on the selected Google Cloud service.

No automated test results, successful real-AI end-to-end run, or completed competition deployment are claimed until evidence exists.

## AI and photo handling

Generated previews are estimates, not guarantees of the final haircut. Details that cannot be established should be marked unknown or confirmed with the barber.

For the functional implementation, credentials must stay on the server, photos must remain private, and logs/analytics must exclude photos and personal notes. Consent text, retention, deletion, and provider data-use statements must match the actual implementation. The prototype's privacy copy is not evidence that these controls are already enforced.

## Scope boundaries

The current MVP target covers photo input, analysis, optional preferences, recommendations, selected-style preview, barber brief, and saving/reopening/deleting a haircut.

Later work may include detailed customization, automatic image export, favorites, actual post-haircut photos, ratings, and cross-device synchronization. These are not claimed as implemented here.

Booking, a marketplace, payments, production advertising, a barber dashboard, native Android release, live AR/3D, and training a custom model are outside the current MVP scope.

## Specification-driven development

The canonical product and engineering baseline is now maintained under `specs/`. Archived PRDs, requirements, design documents, implementation notes, and older task files are historical context only.

Use this development sequence:

**PRD → Requirements → Design → Tasks → Implementation → Acceptance Test → Status Update**

UI screenshots and Figma establish visual/interaction intent. Specifications establish required behavior. Neither alone proves implementation completion.

Mock behavior must remain clearly labeled until a real integration is verified.

## AI Builder Cup preparation

Cutback is being developed toward the **Retail & Commerce** track. The current direction strengthens the technical story by using Google ADK graph orchestration with Gemini reasoning while keeping deterministic logic outside the model.

The target competition story is not “a web app that calls Gemini,” but a controlled AI workflow where:

- deterministic work is handled by code,
- Gemini is used where multimodal reasoning is required,
- final hairstyle choice stays with the user,
- AI outputs are schema-validated,
- preview generation is explicit and cost-controlled,
- failures do not destroy the rest of the user journey,
- execution can be traced and explained.

Submission readiness still requires a functional hosted demo, verified repository setup, architecture explanation, documented model usage and limitations, public-safe assets, and English presentation/demo materials. Current official event requirements and dashboard information must be checked again before submission.

## Credits and licensing

Prototype authoring: Figma Make.

Record the provenance and publication permissions of demonstration portraits and other assets before publishing the repository. This README does not assign a license to the code or images; document the chosen license and asset terms separately.

