# Cutback — Product Requirements Document

Version: **0.2**  
Date: **19 September 2026**  
Status: **Active product baseline for design and implementation planning**

This document replaces `cutback-prd(2).md` version 0.1 as the active PRD. The previous file is retained as history. `cutback-requirements.md` version 0.4 is the active behavioral baseline and must remain aligned with this PRD.

## Changelog

| Version | Date | Changes |
| --- | --- | --- |
| 0.2 | 19 Sep 2026 | Clarified mobile-first web as the primary platform; added smartphone-specific experience and acceptance direction; synchronized foundation-first delivery with BF-01–BF-09; retained Google ADK and agent-skills direction; separated current MVP from later Android/Play Store milestone; refreshed AI Builder Cup alignment using accessible official sources; marked unresolved event-source conflicts and inaccessible T&C items as requiring verification. |
| 0.1 | 19 Sep 2026 | Consolidated product direction, backend foundation, Google ADK, agent-skills, GCP target, and phased delivery. |

## 1. Product intent

Cutback helps a user decide which haircut to choose, understand how it may look on their own photo, communicate the choice clearly to a barber, and later reopen the same haircut without reconstructing the decision from memory.

**Tagline:** “Your best haircut, remembered.” / “Biar ganteng konsisten.”

### 1.1 Problems to solve

1. Users often know they want to look better but do not know the haircut name or which style is suitable.
2. Reference photos of other people do not show how the style may look on the user.
3. Barber instructions such as “rapihin”, “tipisin”, or “jangan terlalu pendek” are ambiguous.
4. A haircut that worked well is difficult to repeat when the user does not retain the model, details, reference, or barber instructions.

### 1.2 Primary user and product role

The primary user is a person—initially focused on men—who wants help before a haircut and later wants to repeat a successful haircut. The barber is the recipient of the barber brief shown by the user; a barber account or barber business dashboard is not required for the MVP.

Cutback targets the **Retail & Commerce** theme for AI Builder Cup because it improves customer discovery and personalization in a service-commerce experience: the user discovers a haircut, evaluates a personalized option, communicates the intended service, and can reuse the same decision on a future visit.

## 2. Product and platform decisions

### 2.1 Primary platform

Cutback is a **mobile-first web app**.

- A smartphone is the primary usage device and the main design constraint.
- Desktop remains supported so the same web application can be opened and used on a larger screen.
- The web MVP must not depend on a native Android capability to complete the core flow.
- A native Android application and Google Play publication remain a **later milestone**, not an MVP requirement and not an AI Builder Cup blocker unless the organizer later states otherwise.

### 2.2 Core experience

The canonical new-haircut flow is:

**Upload → validation → analysis → recommendations → select model → preview → barber brief → save → reopen**

Product rules:

- Preference input is optional and must not block the user before photo upload or the initial analysis.
- A preview is generated only for a model explicitly selected by the user.
- Navigating between screens must not silently trigger additional image generation.
- A failed preview must not erase recommendations and must not prevent the user from creating a barber brief without the preview.
- Reopening a saved haircut must not require a new AI analysis or image generation.

### 2.3 Repeat experience

The repeat flow is:

**My Haircuts → select saved haircut → reopen saved brief → show it again or create a new variation**

The baseline repeat capability is reopening a deliberately saved haircut. Reconstructing a haircut from an old external photo is a different feature and remains an open scope decision.

## 3. Product scope

### 3.1 Functional MVP target

The functional MVP includes:

- photo upload, consent, and validation;
- AI analysis of visible face/hair characteristics;
- haircut recommendations;
- optional simple preferences;
- model selection;
- one personal preview per explicit preview request for the selected model;
- barber brief;
- save, reopen, and delete haircut;
- repeat without new AI generation;
- error, retry, quota, privacy, and consistency handling required to make the core flow trustworthy;
- minimum event instrumentation needed to understand whether users complete the flow.

### 3.2 Later product capabilities

These remain part of the product direction but are not required for the first functional MVP unless explicitly promoted in a later revision:

- detailed structured haircut customization;
- automatic barber-brief image export;
- rename/favorite refinements beyond minimum save behavior;
- post-haircut actual photo and rating;
- account-based cross-device synchronization if the initial save mode is device-local;
- native Android application and Google Play release.

### 3.3 Out of current MVP scope

Do not add the following to the MVP solely for completeness or competition presentation:

- barber booking;
- marketplace;
- payment;
- production advertising/monetization;
- barber business dashboard;
- live AR;
- 3D head modeling;
- multi-angle generation;
- unrestricted visual hair-area editing;
- training a proprietary foundation model or creating a face dataset;
- guaranteed prediction that the barber result will match the AI simulation.

## 4. Mobile-first experience principles

The product is considered mobile-first only if the main flow is genuinely usable from a smartphone, not merely responsive in a desktop emulator.

### 4.1 Minimum interaction expectations

- The main flow must work from a **360 CSS px viewport width** without horizontal scrolling.
- Primary interactive controls use an internal target of at least **44 × 44 CSS px**.
- The upload experience should let a user choose a photo from the device and, when the browser/device supports it, take a new photo. A normal file-upload fallback must always remain available.
- A virtual keyboard must not permanently cover the active input, validation message, or the control needed to continue.
- The original photo and generated preview must be inspectable clearly on a smartphone, with labels that prevent the user from confusing the original photo with the AI simulation.
- Loading, failure, retry, reconnect, and unknown-job states must tell the user what happened and what action is safe next.

### 4.2 Draft continuity

Until a final persistence mechanism is selected, the product baseline is:

- navigation inside the active flow retains the current draft;
- temporarily switching to another application and returning should retain the draft while the browser keeps the page/session alive;
- an unsaved draft is **not guaranteed** to survive a manual refresh, tab close, browser process eviction, device restart, or operating-system memory reclamation;
- the UI must not imply stronger persistence than has actually been implemented;
- after a haircut is explicitly saved successfully, the saved record must survive refresh according to the chosen storage mode.

### 4.3 Mobile validation evidence

Before the functional MVP is considered ready for external demo:

- verify the core flow on **Chrome on Android** and **Safari on iOS**;
- record whether each result came from a real device or an emulator/simulator;
- emulator evidence may accelerate development but does not replace final real-device verification for the primary mobile flow.

## 5. Delivery strategy

### 5.1 Active milestone — Phase 0 backend foundation

The active engineering milestone is the backend foundation defined by **BF-01 through BF-09** in the requirements baseline. The purpose is to prove that the application can run locally, expose a stable API boundary, call Google AI through the chosen runtime, handle errors safely, and be packaged toward GCP deployment before the full product flow is implemented.

Foundation completion is not the same as product MVP completion.

### 5.2 Phase 1 — finalize one flow at a time

For each product slice, use:

**requirement → minimum design → tasks → implementation → acceptance test → decision record**

The design does not need to be exhaustive before all development begins, but the part being implemented must have enough design to avoid guessing contracts, ownership, storage, security, or AI behavior.

### 5.3 Phase 2 — functional MVP

Recommended implementation order:

1. valid photo → structured analysis;
2. analysis + optional preferences → recommendations → select model;
3. selected model → explicit personal preview request;
4. final choice → barber brief;
5. save → refresh/reopen → repeat/delete;
6. harden mobile browser behavior, error recovery, privacy, quota, and instrumentation across the flow.

### 5.4 Phase 3 — GCP validation and submission package

Deploy a small verified version early enough to expose configuration and permission issues. When the product flow is complete, repeat the end-to-end test against the actual submission deployment and prepare the competition evidence package.

## 6. Backend and AI direction

The following direction is retained from PRD v0.1:

- **Google ADK** is the runtime direction for the Cutback AI agent layer.
- **addyosmani/agent-skills** is a development/coding-agent guidance source, not the application runtime and not a replacement for product requirements.
- Development and early testing occur locally.
- The competition deployment target is **Google Cloud**, with the exact deployable service selected in `design.md` in accordance with current event rules.
- Application code remains responsible for validation, authentication/ownership, privacy, quotas, job consistency, and persistence. ADK does not remove those responsibilities.
- Multi-agent architecture is not a requirement. Add agents only when a concrete responsibility and measurable benefit justify the complexity.

The following belong in `design.md`, not in this PRD:

- web and backend framework choices;
- exact repository layout;
- endpoint definitions and transport format;
- request/response schemas;
- AI model identifiers and structured-output schema;
- storage/database/object-storage choice;
- background-job strategy;
- image optimization dimensions/quality thresholds;
- local vs account persistence implementation;
- authentication implementation;
- exact GCP services and deployment topology.

## 7. Quality, privacy, and cost principles

- AI outputs are estimates or simulations, never guarantees.
- Unknown visual attributes are reported as unknown rather than fabricated.
- User photos are private by default and are not placed in logs or analytics.
- API/model credentials remain server-side.
- Every paid AI operation is subject to server-enforced quota and concurrency controls before public access.
- Duplicate taps, reconnects, navigation, and retries must not cause uncontrolled duplicate provider jobs.
- Late AI responses must not overwrite a newer user selection.
- Image optimization is allowed only if the resulting image remains sufficient for reliable analysis and preview. The exact quality threshold must be validated in design/testing rather than guessed in the PRD.

## 8. Success measures

Numerical targets are intentionally not invented before pilot data exists.

| Metric | Definition |
| --- | --- |
| Completion rate | Unique flows that successfully create a barber brief / unique flows with a valid upload. |
| Recommendation selection rate | Unique flows that select a haircut / unique flows that view recommendations. |
| Preview success rate | Valid preview jobs completed / preview jobs started; pending and failure causes reported separately. |
| Save rate | Unique flows that successfully save a haircut / unique flows that create a brief. |
| Barber usefulness | Users who report that the brief helped communicate the haircut / users who actually used the brief with a barber. |
| Repeat usage | Saved-haircut users who later reopen the saved brief for another haircut visit / eligible saved-haircut cohort over a defined observation window. |
| Cost per completed flow | Total AI provider cost attributable to the cohort, including failed/retried attempts / completed flows in that cohort. |

API success alone is not a user-outcome metric.

## 9. AI Builder Cup 2026 alignment

**Verification date:** 19 September 2026.  
**Public sources checked:**

- Official overview: https://aibuildercup.com/
- Official themes and judging page: https://aibuildercup.com/themes.html
- Previously referenced T&C Google document: not accessible through the current verification tool; previous notes are therefore retained only as **needs re-verification**, not promoted as newly verified facts.

### 9.1 Currently verified public rules relevant to Cutback

The accessible official pages currently support these planning assumptions:

- Cutback fits **Retail & Commerce: Intelligent Customer and Business Experiences**, including discovery and personalization.
- The entry must be a functional prototype, not only a pitch or mockup.
- Current themes guidance requires Google AI models such as Gemini/Gemma or listed Google agentic platforms, and deployment on Google Cloud using Cloud Run or Firebase.
- Submission guidance on the themes page calls for a proposal/deck converted to PDF, a functional deployed prototype, and a public video link of three minutes showing the solution.
- The themes page states submission materials, including code, documentation, and presentations, must be in English.
- Current judging weights shown publicly are: Technical Merit & Gen AI Implementation 40%, Problem Alignment & Impact 25%, Innovation & Creativity 25%, User Experience & Solution Design 10%.
- The currently indexed official overview states team formation from 1 September to 11 October 2026, prototype building/submission from 7 September to 18 October 2026, finalist announcement on 7 November, and Demo Day in Singapore on 4 December 2026.
- The currently indexed overview says teams are **2–4** people and students are not eligible; participants are 21+ and the program targets working professionals, entrepreneurs, and startups in JAPAC.

### 9.2 Official-source conflicts and unverified items

Do not silently resolve the following as facts:

1. A cached official overview retrieved during verification still contains older **1–4 member** wording, while the currently indexed overview shows **2–4**. Use 2–4 as the current working rule, but verify the participant dashboard and latest T&C before the roster is considered final.
2. The themes page contains a category-specification subsection that lists categories inconsistent with the six main themes. Cutback should remain mapped to Retail & Commerce unless the actual submission form requires another field, in which case use the dashboard as the final operational source.
3. The previous requirements baseline stated that a public GitHub repository is mandatory. That requirement could not be re-verified from the accessible official pages in this pass. Keep a public-ready repo in the submission plan, but mark its mandatory status **needs verification**.
4. The previous baseline stated freshness/originality restrictions for code and assets based on the T&C. The referenced T&C source could not be accessed in this pass. Do not declare old Cutback code/assets eligible merely because the project is rebuilt as “V2”; verify the latest T&C or obtain written organizer clarification before deciding what old assets may enter the submission.
5. The themes page says “3 minutes” for the video. If the team chooses an internal target such as 179 seconds, document that as a safety margin, not as an official rule unless the dashboard/T&C explicitly says “under 3 minutes.”

### 9.3 Evidence Cutback should prepare

Competition work should produce evidence, not competition-only product bloat:

- **AI evidence:** show that real Google AI participates meaningfully in analysis/recommendation/preview as applicable; do not present mocks as live AI.
- **Deployment evidence:** a working event deployment on the service permitted by the verified rules.
- **End-to-end demo:** show the smartphone flow from upload through recommendation, selected preview, barber brief, save, and reopen.
- **Barber-brief value:** clearly demonstrate why the brief reduces ambiguity compared with a generic reference image or verbal instruction.
- **Repeat value:** reopen a saved haircut without rerunning AI.
- **Repository:** keep the codebase reviewable and safe for publication; verify whether public-repo submission is mandatory before final submission.
- **Video and deck:** demonstrate the actual product and architecture without invented traction, impact, or validation results.
- **Language:** prepare submission-facing artifacts in English while allowing internal working documents to remain Indonesian.

## 10. Product risks and open decisions

The following remain unresolved and should be closed during design rather than guessed in implementation:

1. web/frontend framework and backend framework;
2. monorepo vs separate frontend/backend repositories;
3. Google ADK version and exact Google model(s);
4. image-generation model and whether the competition-allowed Google path supports the required identity-preserving preview quality;
5. API contracts and structured-output schemas;
6. image upload normalization/compression limits and quality validation criteria;
7. persistence mode for MVP: local device/browser vs authenticated account storage;
8. if account storage is selected, authentication and ownership model;
9. photo/object storage, database, retention, deletion, and backup behavior;
10. quotas, concurrency limits, and test/demo budget;
11. job/retry/reconnect mechanism that guarantees duplicate protection;
12. scope of haircut customization in the first functional MVP;
13. whether reconstruction from an old haircut photo is a future feature;
14. final GCP deployment service and topology;
15. event-specific unresolved items: team-size conflict, repo requirement, old-code/asset freshness, T&C details, and exact submission-form requirements.

## 11. Document governance

- This PRD defines product direction, scope, delivery priority, success criteria, and competition alignment.
- `cutback-requirements.md` defines observable behavior and acceptance criteria.
- `design.md` will define technical implementation decisions.
- `tasks.md` will decompose design and requirements into executable work.
- Product behavior changes require PRD/requirements review before code is merged if the change alters agreed behavior.
- Manual code edits are allowed; spec-driven means the implemented behavior and the authoritative spec must be synchronized, not that code can never be edited directly.
- Historical source files remain read-only references and must not be treated as concurrent active baselines.
