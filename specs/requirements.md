# Cutback — Requirements

Version: **0.5**  
Date: **21 September 2026**  
Product: **Cutback V2**  
Status: **Behavioral planning baseline aligned with PRD v0.3; design reconciliation and implementation verification remain open.**

This revision updates the user-supplied standalone requirements v0.4 (`ce609460-65d2-46b3-b2b9-78afe333fd35.md`) to v0.5 and uses `cutback-prd-v0.3.md` for product direction. This supplied v0.4 confirms the standalone baseline and BF-01–BF-09 that were unavailable during the preceding PRD audit. Earlier requirements and the separately generated combined alignment package are historical references, not concurrent active requirements. Requirement IDs are retained; additions use new acceptance/test IDs. This update specifies required behavior and does not claim that the prototype, code, or design has already been updated.

## Changelog

| Version | Date | Changes |
| --- | --- | --- |
| 0.5 | 21 Sep 2026 | Aligned with PRD v0.3 transformation journey and prototype evidence; resolved consent sequencing; added behavioral criteria and traceability for AL-01–AL-10, relative preferences, correction, image labels, preview state actions, persistence messaging, motion and mobile checks; retained existing IDs and open configuration decisions. |
| 0.4 | 19 Sep 2026 | Synchronized with PRD v0.2; made mobile-first web explicit; added smartphone acceptance behavior for 360 px layouts, 44×44 CSS px touch targets, gallery/camera input, virtual keyboard, image inspection, disconnect/retry behavior, draft continuity, image-quality preservation, and real-device browser verification; added BF-01–BF-09 as active foundation requirements; clarified foundation-first milestone versus later functional MVP; retained Google ADK and agent-skills direction while leaving framework/API/schema/storage for design.md; refreshed AI Builder Cup rules from accessible official sources and downgraded inaccessible/conflicting event claims to needs-verification status. |
| 0.3 | 19 Sep 2026 | Added event parameters, submission evidence gates, Google Cloud boundaries, and reuse/freshness checks. |
| 0.2 | 19 Sep 2026 | Reorganized behavioral baseline, feature acceptance criteria, stale-result handling, persistence, and traceability. |
| 0.1 | 19 Sep 2026 | Initial consolidated requirement draft. |

## 1. Document role and terminology

### 1.1 Authority

- `cutback-prd.md` defines product purpose, scope, priority, and delivery direction.
- This document defines observable behavior, constraints, and acceptance criteria.
- `design.md` will define implementation choices such as framework, API shape, schema, storage, image-processing pipeline, authentication mechanism, and deployment topology.
- Tasks and tests must reference requirement/acceptance IDs from this document.
- Historical files are context only and must not override the active PRD or this active requirements baseline.

### 1.2 Requirement labels

- **MVP:** required for the first functional end-to-end product milestone.
- **Foundation:** required for the active backend-foundation milestone before the full MVP is considered complete.
- **Later:** explicitly outside the first functional MVP unless promoted by a later approved revision.
- **Proposal:** planning default that still requires a design/product decision before implementation can treat the detail as fixed.
- **Verified event rule:** rechecked against an accessible official public source on the verification date.
- **Needs verification:** retained planning item that could not be confirmed from an accessible official source or conflicts with another official source.

### 1.3 Core terms

- **Analysis:** AI-assisted estimate of characteristics visible in the submitted photo.
- **Recommendation:** suggested haircut model and rationale; not a guarantee of suitability.
- **Preview:** AI-generated simulation of the selected haircut on the user's photo.
- **Brief:** structured instructions that the user can show to a barber.
- **Revision:** a version binding photo/analysis/preferences/model/parameters to downstream results.
- **Stale:** a result that belongs to an older revision and must not be presented as the current result.
- **Attempt:** a paid/provider-bound AI request actually sent upstream; local validation failures and duplicate clicks blocked before provider invocation are not attempts.
- **Saved haircut:** a record that has completed persistence and can be reopened after refresh according to the chosen storage mode.

## 2. Product context, platform, and scope

### 2.1 Goal

Cutback helps a user choose a haircut, evaluate a personalized simulation, communicate the intended result to a barber, and later reopen the saved haircut so the same decision can be repeated.

**Narrative:** Transformation Journey for Your Best Haircut.  
**Experience principle:** Identity stays. Hair transforms.  
**Tagline:** Your best haircut, remembered.

The journey connects understanding the current look, choosing a direction, previewing a selected haircut, communicating it, and remembering it. It does not add a longitudinal photo timeline or actual post-haircut tracking to MVP.

### 2.2 Primary platform

- Cutback is a **mobile-first web app**.
- Smartphone usage is primary; desktop usage remains supported.
- The first functional MVP must not require installation of a native Android app.
- Native Android and Google Play publication are a **Later** milestone.

### 2.3 User roles

- **Guest user:** can try the core flow without being forced to create an account before upload/analysis.
- **Saved-data owner:** user/session identity allowed to access a saved record under the chosen persistence model.
- **Barber:** reads the brief shown by the user; no barber account is required for MVP.

### 2.4 Functional MVP scope

| Capability | Status |
| --- | --- |
| Photo selection/capture fallback, preview, consent, and validation | MVP |
| AI analysis | MVP |
| Recommendations | MVP |
| Optional simple preferences | MVP |
| Select exactly one active model per revision | MVP |
| Explicit personal preview for the selected model | MVP |
| Barber brief on mobile screen | MVP |
| Save, reopen, repeat, and delete haircut | MVP |
| Privacy, stale-result prevention, errors, reconnect/retry, quotas, instrumentation | MVP |
| Detailed haircut customization controls | Later unless explicitly promoted |
| Automatic image export of barber brief | Later |
| Post-haircut actual photo/rating | Later |
| Account sync across devices | Conditional on persistence design; not mandatory if MVP uses local storage |
| Native Android/Play Store | Later |

### 2.5 Out of MVP scope

Booking, marketplace, payments, production advertising, barber dashboard, live AR, 3D head modeling, multi-angle generation, unrestricted visual editing, proprietary foundation-model training, and a guarantee that a real barber result will match an AI simulation.

### 2.6 Current evidence boundary

Ten supplied screenshots and the reviewed README represent a UI prototype with simulated AI. They show the main successful journey, optional preferences, Unknown analysis, brief notes, and save/reopen/delete controls. They do not prove live interactions, real personalized AI, storage after refresh, backend completion, mobile measurements, or motion quality. States not pictured are not evidenced, rather than proven absent. All acceptance criteria below require execution evidence before being marked passed. Retain the navy/gold editorial and portrait-led direction while resolving the listed behavior gaps.

Old external haircut-photo reconstruction remains outside MVP; adding it requires a scope revision.

## 3. Canonical user flows

### 3.1 New haircut

**Select photo locally → local file checks → consent → transmit → server/visual validation → analyze → recommendations → select model → explicitly request preview → barber brief → save → reopen**

Rules:

- Preferences are optional and may be skipped.
- Preview generation requires an explicit action after a model is selected.
- The system must not generate previews for all recommendations automatically.

### 3.2 Preference refinement

**Analysis/recommendations → optional preferences → apply → refreshed recommendations → select model**

Changing local preference controls alone does not call AI until the user explicitly applies the change.

### 3.3 Repeat

**My Haircuts → select saved haircut → reopen saved brief → show again or create a variation**

Reopening a saved haircut does not rerun analysis or preview generation.

### 3.4 Mobile draft continuity baseline

Until the persistence design is finalized:

- in-flow navigation within the same active app session retains the draft;
- leaving the browser for another app and returning should retain the draft if the page/session remains alive;
- unsaved drafts are not guaranteed across manual refresh, tab close, browser/process eviction, device restart, or operating-system memory reclamation;
- the UI must not promise draft persistence beyond what the implementation can prove;
- successfully saved haircuts must be reopenable after refresh under the selected storage mode.

## 4. Active foundation requirements — BF-01 to BF-09

The current engineering objective is to connect the existing prototype to a verified backend foundation while reconciling the relevant design slice. Inspect the exported repository first; reuse work supported by evidence and do not assume either completion or absence from screenshots. These requirements do not replace the product FRs; they establish the execution base on which the FRs will be implemented.

### BF-01 — Project structure and local setup

**Priority:** Foundation.  
A fresh checkout can be configured and run locally using documented steps and example configuration without committing secrets.

Acceptance:

- BF-01.1: documented install/start commands succeed from a clean environment supported by the project;
- BF-01.2: required configuration variables are listed with safe examples/placeholders;
- BF-01.3: no real credential is required to be committed to source control.

### BF-02 — Server API and health endpoint

**Priority:** Foundation.  
A server boundary exists for application calls and exposes a health check that does not invoke paid AI.

Acceptance:

- BF-02.1: health returns a structured success response when the server is ready;
- BF-02.2: health failure is distinguishable from AI-provider failure;
- BF-02.3: health does not consume AI quota.

### BF-03 — Minimal real Google ADK integration

**Priority:** Foundation.  
Google ADK is the chosen runtime direction for the AI agent layer. A minimal diagnostic/smoke capability must prove a real Google model call before the foundation is declared complete.

Acceptance:

- BF-03.1: one deliberately invoked smoke request reaches the configured real Google model through the ADK path and returns a real response;
- BF-03.2: the diagnostic request is not presented as haircut analysis unless it actually implements FR-02;
- BF-03.3: if credentials/budget/model access are unavailable, BF-03 remains blocked rather than being marked complete based on a mock.

### BF-04 — Environment configuration

**Priority:** Foundation.  
Local and GCP-target environments are configurable without code edits for secrets/environment-specific values.

Acceptance:

- BF-04.1: missing mandatory configuration fails with an actionable error;
- BF-04.2: secrets are not returned to the client or printed in ordinary logs;
- BF-04.3: environment-specific values are separated from product behavior.

### BF-05 — Response and error contract

**Priority:** Foundation.  
Success and failure responses have a consistent contract and a request identifier usable for troubleshooting and duplicate protection.

Acceptance:

- BF-05.1: invalid input, internal failure, timeout, and provider failure are distinguishable;
- BF-05.2: client-facing errors do not expose secrets/internal stack traces in production behavior;
- BF-05.3: a request/job identifier is available where required for tracing/retry reconciliation.

### BF-06 — Logging and baseline security

**Priority:** Foundation.  
Logs support diagnosis without recording secrets, user photos, raw image data, or private free-text content.

Acceptance:

- BF-06.1: logs may include request ID, stage, status, duration, model identifier, and usage/cost metadata where available;
- BF-06.2: credentials/tokens/photos/base64/private notes are absent from ordinary logs;
- BF-06.3: paid diagnostic endpoints are not exposed publicly without access and quota controls.

### BF-07 — Foundation tests

**Priority:** Foundation.  
Automated tests cover health, validation, response/error contract, and duplicate-safe behavior using stubs/mocks where appropriate; a separate explicit smoke test covers real AI.

Acceptance:

- BF-07.1: normal test execution does not unexpectedly spend AI quota;
- BF-07.2: a real-AI smoke test is separately named/documented and deliberately invoked;
- BF-07.3: foundation errors have at least one negative-path test.

### BF-08 — GCP deployment preparation

**Priority:** Foundation.  
The application can be packaged for the selected Google Cloud deployment path, while “package/build ready” remains distinct from “verified deployed.”

Acceptance:

- BF-08.1: build/package succeeds locally/CI for the intended runtime;
- BF-08.2: deployment configuration and required environment variables are documented;
- BF-08.3: the project does not claim GCP deployment success until an actual deployed endpoint has been tested.

### BF-09 — agent-skills integration for coding workflow

**Priority:** Foundation.  
`addyosmani/agent-skills` is used as coding-agent guidance where relevant, without allowing external coding instructions to silently override product requirements.

Acceptance:

- BF-09.1: the installed/used skill source and version/commit are recorded;
- BF-09.2: repository instructions are reviewed before use;
- BF-09.3: conflicts with PRD/requirements are resolved explicitly rather than by silently changing product behavior.

### Foundation gate

BF-01–BF-09 require relevant evidence before the foundation is considered complete. Foundation completion does **not** mean the functional Cutback MVP is complete.

## 5. Functional requirements

### 5.1 FR-01 — Upload and validate photo

**Priority:** MVP.  
**User story:** As a user, I want to provide my photo so the analysis and preview relate to me.

**Inputs:** One JPEG, PNG, or WebP photo; processing consent.

**Main flow:** Select/take photo → local preview and local checks → consent → transmit → trusted-server validation → visual suitability validation → analysis.

#### Rules

- Proposal: maximum file size 10,000,000 bytes until design confirms the limit.
- Format/content validation occurs on the trusted server boundary before AI processing; extension alone is not sufficient.
- Guidance asks for one person, visible face and hair, and adequate lighting.
- Consent is not preselected and is required before transmitting photo bytes for processing, including server upload/validation. A local-only preview may appear before consent. If visual suitability validation uses an AI provider, it is subject to quota and attempt accounting; invalid input must not proceed to a usable analysis/recommendation.
- A photo with no detectable usable face, multiple people, or hair insufficiently visible must not be treated as a valid analysis input.
- On supported mobile browser/device combinations, the user can choose an existing image and can access a camera capture option. A standard file-selection fallback remains available when direct capture is unavailable or declined.
- The user can inspect and replace the selected photo before analysis.
- Image normalization/compression is allowed, but the processed image supplied to analysis must preserve enough face/hair detail to pass quality validation. Exact dimensions/quality values belong in design and must be tested, not guessed.
- Rejecting a new replacement image must not silently destroy the last valid in-flow draft unless the user explicitly replaced it.

#### Acceptance criteria

- AC-01.1: valid image + consent → analysis request may start.
- AC-01.2: corrupt/unsupported/oversized image → specific error, no AI attempt.
- AC-01.3: no consent → no photo is sent for AI processing.
- AC-01.4: inadequate visual input → user is asked to replace it; no fake recommendation is shown.
- AC-01.5: on a supported real mobile device/browser, gallery selection works; camera capture is offered when the platform exposes it.
- AC-01.6: where direct camera capture is not supported, file upload still completes the same flow.
- AC-01.7: the selected image can be inspected clearly on a 360 px-wide viewport before analysis.
- AC-01.8: the chosen optimization path passes a documented image-quality check for face/hair visibility before being accepted as the analysis input path.

- AC-01.9: fresh flow has unchecked consent; inspecting network traffic before consent shows no outbound photo bytes. With consent, trusted validation precedes usable analysis.
- AC-01.10: consent purpose and privacy/training statements match documented provider configuration and retention behavior; unsupported blanket promises are not displayed.

### 5.2 FR-02 — Analyze photo

**Priority:** MVP.  
**User story:** As a user, I want an understandable summary of visible characteristics to support recommendations.

**Prerequisite:** valid photo, consent, active photo revision.

#### Rules

- Output includes estimated face shape and visible hair characteristics only to the extent the input supports them.
- Attributes that cannot be determined are explicitly marked unknown.
- Do not infer identity, ethnicity, personality, or health diagnosis.
- The user can correct hair observations that are wrong before requesting updated recommendations.
- AI output must be schema-valid before the application treats it as a usable analysis.
- Mock/stub output used for development must never be presented to a user/demo audience as real analysis.

#### Acceptance criteria

- AC-02.1: valid response → structured summary appears and recommendation flow can continue.
- AC-02.2: unobservable attribute → shown as unknown, not fabricated.
- AC-02.3: AI/timeout/schema failure → photo remains available and no fake analysis/recommendation appears.
- AC-02.4: correcting analysis marks dependent recommendations/selection/preview/brief stale until recomputed as applicable.

- AC-02.5: a visible correction action lets the user revise hair observations without re-uploading an unchanged photo; editing alone does not create a provider attempt. Explicit application updates dependent revisions as in AC-02.4.
- AC-02.6: uncertain observations remain Unknown until supported by analysis or explicit user input; corrected data is distinguished from AI-observed data in the logical record.

### 5.3 FR-03 — Recommend haircut models

**Priority:** MVP.  
**User story:** As a user, I want to compare a small number of haircut options before choosing one.

#### Rules

- Proposal: show three materially different models when input supports them; do not pad the list with duplicates if it does not.
- Each recommendation includes name, description, rationale, styling effort, and practical constraint where relevant.
- One option may be labeled “Best Match” only with an explanation; it is not a certainty score.
- Reference images, if used, are labeled as references and are distinct from the user's generated preview.
- Recommendations do not automatically trigger personalized preview generation.
- Exactly one model is active in a revision after selection.

#### Acceptance criteria

- AC-03.1: every displayed recommendation contains the required explanatory fields.
- AC-03.2: choosing B after A makes B current; artifacts for A are not shown as if they belong to B.
- AC-03.3: returning to the recommendation list does not force a new upload or analysis while the source revision is unchanged.

- AC-03.4: every recommendation image is distinguishable as original photo, reference, or demo imagery as applicable; none is implied to be a newly generated personal preview before selection and explicit generation.
- AC-03.5: browsing all recommendation alternatives creates zero image-generation attempts; selection alone does not imply a preview already exists.

### 5.4 FR-04 — Optional preferences

**Priority:** MVP simple.  
**User story:** As a user, I want recommendations to consider style and maintenance preferences, but I do not want a form to block me before analysis.

#### Rules

- Preference categories are optional.
- Proposal categories: vibe, desired length, styling effort, and free-text note.
- Proposal: one choice per structured category; note maximum 500 Unicode characters after trim.
- Conflicting preferences are explained rather than silently ignored.
- Editing local controls does not call AI until the user explicitly applies/requests updated recommendations.
- Free-text preference content is user data and cannot be allowed to override system security rules or access another user's data.

#### Acceptance criteria

- AC-04.1: all preferences empty → flow can continue.
- AC-04.2: 500-character note accepted; 501-character note rejected with content preserved.
- AC-04.3: changing controls alone creates no AI attempt; explicit apply/update may create one.

#### Preference semantics and additional acceptance

Relative length choices observed in the prototype mean change relative to current hair: Shorter, Keep current, Slightly longer. If retained, they must remain relative in the contract rather than being silently mapped to absolute short/medium/long. The final option set and effort thresholds remain explicit design decisions. Unknown current length must not become an invented measurement. Longer recommendations explain any growth requirement.

- AC-04.4: a retained relative-length choice reaches recommendation input with the same meaning; unknown reference length is surfaced as uncertainty or a clarification, not converted to a fabricated size.
- AC-04.5: preference and recommendation effort categories use the same documented definition. If a suggestion exceeds the chosen effort, the difference is stated and the user can choose an alternative; the same unexplained Medium label cannot mean 5–10 minutes on one screen and 10–15 on another.
- AC-04.6: Skip with empty preferences works; applying changed preferences makes prior recommendations/selection/preview/brief inactive or visibly stale until updated. Previous results must not appear current after a failed refresh.

### 5.5 FR-05 — Generate personal preview for selected model

**Priority:** MVP.  
**User story:** As a user, I want to see a simulation of the haircut I selected on my own photo.

#### Rules

- Preview starts only after one model is active and the user explicitly requests it.
- One request targets one current revision; navigating pages does not generate a new preview.
- The result is labeled as an AI simulation and not a guarantee of a real haircut result.
- Generation should preserve recognizability of face, skin tone, and background as far as the selected model supports; quality acceptance is visual, not just HTTP/API success.
- A preview is always linked to the revision/model that created it.
- A late preview from an old model/revision cannot replace a newer choice.
- Failed preview retains recommendations and allows retry or barber brief without preview.
- A successful preview is reusable when the user navigates away and back; navigation alone does not consume another image attempt.
- On smartphone, original and preview must be inspectable clearly enough to compare without horizontal scrolling.

#### Acceptance criteria

- AC-05.1: double tap while a preview job is pending → one logical job/attempt, not two provider jobs.
- AC-05.2: navigate away/back → completed current preview is reused without regeneration.
- AC-05.3: select B while A is pending → A cannot appear as B's current preview.
- AC-05.4: preview failure → user can still create a brief with preview-unavailable state.
- AC-05.5: documented visual review confirms the user's face remains recognizable and hairstyle aligns with the selected model; transport/API success alone is insufficient.
- AC-05.6: at 360 px width the original and preview can be inspected and distinguished without horizontal page scrolling.

- AC-05.7: original view has an Original label; generated view has an AI simulation label and a clear statement that real results may differ. Prototype/demo labels describe actual mode without relabeling the original as generated.
- AC-05.8: no preview yet offers an explicit generation action; pending prevents duplicate requests; failed offers retry and continue without preview; available offers comparison and an explicitly named regeneration action if supported. Quota/usage status is shown before a paid action.
- AC-05.9: switching Original/Possible reuses existing assets with zero provider calls. In the comparison, face position, pose, framing, and background remain stable as closely as possible; document visual review against the same source photo and do not claim success from API status alone.
- AC-05.10: stale output is labeled and cannot be passed to a new brief as the current preview; continuing without a valid preview preserves the active model and indicates preview unavailable.

### 5.6 FR-06 — Detailed haircut customization

**Priority:** Later; simple notes remain available through the brief/preferences flow.  
**User story:** As a user, I want to fine-tune haircut details before finalizing the brief.

#### Rules

- Candidate controls: top/side/back length, fade, fringe, styling direction where relevant.
- Options and units must be understandable; photo analysis cannot invent exact physical measurements.
- Incompatible combinations are explained.
- Changing a control does not automatically call AI; the user explicitly requests an updated preview.
- Parameter changes make old preview/brief stale.
- “Full customize” means structured controls + notes, not 3D or free-form image-region editing.

#### Acceptance criteria

- AC-06.1: parameter change → dependent preview/brief marked stale.
- AC-06.2: Update Preview uses the current parameter revision.
- AC-06.3: regenerated brief uses the same final parameters.

### 5.7 FR-07 — Barber brief

**Priority:** MVP for on-screen brief; automatic image export Later.  
**User story:** As a user, I want concise instructions that I can show directly to my barber.

#### Rules

- Brief includes selected model, user photo/reference context, relevant cut details, styling guidance, optional note, and current preview if one is valid.
- Unknown details say “confirm with barber” or equivalent; do not fabricate exact measurements.
- Preview absence does not block a text/structured brief.
- Notes are annotations; editing a note does not retroactively change a preview image.
- Model/parameter revision changes make an older brief stale.
- Brief must be readable on a smartphone without horizontal page scrolling.
- Sharing/export, when later implemented, must be initiated by the user and must not make private photos public by default.

#### Acceptance criteria

- AC-07.1: no preview available → brief can still be created with explicit preview-unavailable state.
- AC-07.2: no active model → brief creation is blocked with a route back to model selection.
- AC-07.3: note over the configured limit → nearby error, note content retained.
- AC-07.4: stale brief cannot be silently saved as if it represented the newest model/parameters.
- AC-07.5: core brief content is readable and primary actions remain reachable at 360 px width.

- AC-07.6: editing brief notes updates the brief annotation without generating an image; UI explains notes do not modify the simulation. Saved notes survive reopen.
- AC-07.7: original and generated images retain distinct labels in the brief; absent or stale preview uses an explicit unavailable state rather than a demo substitute.

### 5.8 FR-08 — Save and manage haircut

**Priority:** MVP for save/open/delete; rename/favorite refinements may be Later.  
**User story:** As a user, I want to preserve a haircut so I can use it again on another visit.

#### Rules

- Proposal default name is the model name; final saved name is 1–50 Unicode characters after trim.
- A saved record includes enough snapshot data to reproduce the brief and show relevant stored images/preview without rerunning AI.
- Show success only after persistence actually succeeds.
- Duplicate taps for one save action do not create duplicate records.
- Failed save retains the draft and does not show false success.
- Local-device storage, if selected, must persist real image bytes/durable references rather than temporary object URLs.
- Delete requires confirmation and removes the record/assets according to the storage/retention design.

#### Acceptance criteria

- AC-08.1: save succeeds → refresh → the saved brief and stored image references reopen under the chosen persistence mode.
- AC-08.2: blank/51-character name → rejected without losing draft.
- AC-08.3: failed save → no success message and draft remains usable.
- AC-08.4: confirmed delete → record does not return after refresh.
- AC-08.5: empty list → user sees a clear action to create a first haircut.

- AC-08.6: confirmation states the selected persistence scope. Local mode identifies this browser/device and does not promise cross-device or indefinite availability; account mode identifies account storage only after successful persistence.
- AC-08.7: canceling delete keeps record and assets; confirming delete follows AC-08.4 and the retention policy. Storage-full/network failure preserves the active draft and offers a recoverable action.

### 5.9 FR-11 — Reuse saved haircut

**Priority:** MVP.  
**User story:** As a user, I want to repeat a saved haircut without reconstructing the whole AI flow.

#### Rules

- Reopen/repeat uses the stored snapshot and does not call AI.
- Display the saved date or equivalent context so the user knows it is an older saved haircut.
- Creating a variation does not silently overwrite the original saved record.

#### Acceptance criteria

- AC-11.1: Repeat this cut → saved brief content opens and creates zero AI attempts.
- AC-11.2: create variation → original record remains unchanged unless the user explicitly replaces it through a defined action.

- AC-11.3: if both Open Brief and Repeat This Cut remain visible, each reopens the same selected snapshot without provider calls. Their presentation is documented or the redundant control is consolidated; neither silently starts a new flow.
- AC-11.4: reopening records only a reopen event, not an actual haircut visit. Any reported repeat visit requires separate user confirmation or research evidence.

### 5.10 FR-09 — Document actual post-haircut result

**Priority:** Later.  
**User story:** As a user, I want to record the real result for future reference.

Rules and acceptance retain the previous baseline direction: actual photo is labeled distinctly from AI preview; it follows photo validation; rating range proposal 1–5; actual result does not overwrite the AI preview.

Acceptance:

- AC-09.1: actual photo remains distinct from AI preview.
- AC-09.2: rating outside configured range is rejected.
- AC-09.3: future favorite/reference behavior, if implemented, points to the chosen actual result without destroying the original record.

### 5.11 FR-12 — Guest and authenticated access

**Priority:** Guest path MVP; login conditional on persistence design.  
**User story:** As a user, I want to try the product without an unnecessary account wall.

#### Rules

- Login is not required before upload/analysis.
- If MVP uses local storage, the UI states that data is stored on this browser/device and does not promise sync.
- If account storage is chosen, permanent server-side save may require login but the active draft must survive the login step as far as the chosen session design guarantees.
- Every server-side saved record access verifies the owner/session at the server boundary, not only the record identifier.
- Cancelled/failed login must not send the draft to another account.

#### Acceptance criteria

- AC-12.1: guest can reach the barber brief.
- AC-12.2: local-storage mode → saved record survives refresh on the same browser/device and UI explains the scope.
- AC-12.3: account mode → owner A cannot read/update/delete owner B data.
- AC-12.4: successful login during save does not rerun completed analysis or preview merely because authentication happened.

## 6. Cross-feature behavior — FR-10

FR-10 remains the cross-feature contract for state, retries, duplicate protection, quota, reconnect, and stale results.

### 6.1 Dependency chain

Photo → analysis → recommendations/preferences → selected model/parameters → preview + brief → saved haircut.

Each derived artifact belongs to a specific revision.

### 6.2 Invalidation rules

| Change | Required effect |
| --- | --- |
| Replace valid photo | Current analysis and downstream draft results become inactive/stale; previously saved records remain intact. |
| Correct analysis / apply preferences | Old recommendations, selection, preview, and brief become stale as applicable. |
| Change selected model / parameters | Old preview and brief become stale; analysis does not need to rerun solely for that reason. |
| Edit brief note only | Brief annotation updates; visual preview is unchanged. |
| Reopen saved haircut | Use saved snapshot; do not mix it with the current unsaved draft. |

### 6.3 Job state

Every AI operation has at least: idle, pending, succeeded, failed; a result may also be stale with respect to the active revision.

Do not show invented percentage progress unless actual measurable progress exists.

### 6.4 Duplicate, retry, and reconnect behavior

- One identical pending operation creates one logical job.
- Rapid repeated taps must not create parallel duplicate provider attempts.
- Manual retry is allowed after an explicit failure/terminal state and is subject to quota.
- If the network disconnects or the client times out after a request may already have reached the server/provider, the system must reconcile the existing job status before creating another provider attempt whenever the previous job may still be running.
- Reconnect must not silently restart a paid job.
- A late response for an older revision cannot overwrite the current revision.
- A user leaving the page does not create a promise that an upstream paid request can be cancelled if the provider already accepted it.

### 6.5 Quota and cost

- Analysis/image/concurrency/budget limits are server-enforced before public AI access.
- Remaining availability or a clear limit-reached state is shown before the user initiates an action that can spend quota where practical.
- A provider-bound attempt counts even if it later fails/times out; locally rejected input and blocked duplicate clicks do not.
- Save, navigation, reopen, and repeat do not consume AI generation quota.
- Default unlimited generation is not acceptable.

### 6.6 Draft/navigation behavior

- In-flow navigation retains current draft state.
- Temporary mobile app switching is supported only to the extent the browser keeps the page/session alive.
- Unsaved draft persistence across refresh/tab close/process eviction/device restart is not promised until a design implements and tests it.
- Successfully saved records must persist according to FR-08/FR-12.

### FR-10 acceptance criteria

- AC-10.1: duplicate tap on one pending action → one logical job/provider attempt.
- AC-10.2: quota exhausted → server rejects before a new provider attempt.
- AC-10.3: result A arrives after user chooses revision B → A cannot replace B.
- AC-10.4: timeout/disconnect → UI gives a recoverable state; retry does not duplicate a still-running job.
- AC-10.5: preview failure → recommendation and brief path remain available.
- AC-10.6: reconnect after an ambiguous request outcome does not automatically create a second paid attempt without reconciliation.

## 7. Data, privacy, and ownership

### 7.1 Minimum logical data

- session/owner identity and consent state;
- original photo and derived preview/actual image references;
- analysis + unknown attributes + model/schema version;
- preferences;
- recommendations;
- selected haircut revision;
- preview status/output;
- barber brief;
- saved haircut snapshot;
- AI job/request metadata.

Physical tables/collections/objects belong in design.md.

### 7.2 Consent

Explain the purpose of photo processing before transmitting photo bytes, including upload for server validation. Consent defaults unchecked. Privacy and training statements must match the actual provider configuration and product behavior; prototype copy is not proof of enforcement. Consent for AI processing is not consent for public sharing or model training.

### 7.3 Privacy

- Photos are private by default.
- Secrets remain server-side.
- Analytics/logs do not contain photo bytes/base64, authentication tokens, haircut-name text, or free-text notes.
- Server-side stored data is readable/mutable only by the authorized owner/session.

### 7.4 Retention

Proposal retained from v0.3 until design/policy confirms it:

- temporary guest server copy maximum 24 hours where server upload storage is used;
- server deletion revokes active access promptly and deletes active objects within a defined operational window (proposal: 24 hours);
- backup/provider retention must be documented before claiming complete deletion from all systems;
- local intentionally saved data remains until user deletion or browser/device storage removal.

## 8. Non-functional requirements

| ID | Area | Requirement |
| --- | --- | --- |
| NFR-01 | Mobile usability | Core flow works from 360 CSS px width without horizontal page scrolling. Primary buttons/controls use an internal target of at least 44×44 CSS px. Forms have visible labels, errors do not rely on color alone, and virtual keyboard behavior must leave the active field/error/continue action reachable. |
| NFR-02 | Security | AI keys/secrets are absent from client bundles; trusted-server validation and ownership checks protect private server data. |
| NFR-03 | Privacy | User photos are private and excluded from ordinary logs/analytics; consent purpose is clear. |
| NFR-04 | Retention | Expiry/deletion behavior matches the selected storage mode and documented policy; the UI does not promise deletion beyond what is implemented. |
| NFR-05 | Performance and media quality | Proposal: visible loading feedback within 1 second; analysis timeout 60 s and image timeout 120 s pending design validation. Image optimization must not reduce input below validated face/hair usefulness. Timeout is a recovery boundary, not a guarantee that the provider finished or stopped. |
| NFR-06 | AI/data integrity | AI responses pass schema validation; unknown attributes remain unknown; failures never become fake complete output. |
| NFR-07 | Observability | Record request/job ID, stage, status, latency, model/version, and usage/cost metadata where available without sensitive payloads. |
| NFR-08 | Cost control | Server enforces quota, concurrency, duplicate suppression, and budget limits before provider invocation. |
| NFR-09 | Consistency | Every derived result belongs to a revision; stale/late results cannot masquerade as current. |
| NFR-10 | Browser compatibility evidence | Before external demo, core flow is verified on Chrome Android and Safari iOS. Test evidence identifies real device vs emulator/simulator. Desktop remains supported, but real-device mobile evidence is required for the primary experience. |
| NFR-11 | AI preview quality | Visual review checks recognizability/identity continuity and haircut alignment; provider success code alone is not quality acceptance. |

### 8.1 Mobile acceptance profile

The following are test expectations tied primarily to NFR-01/NFR-10 and the relevant FRs:

- MOB-01: 360 px viewport completes upload → analysis → recommendations → select → preview → brief → save without horizontal page scrolling.
- MOB-02: primary actions meet the 44×44 CSS px internal touch-target minimum.
- MOB-03: gallery/file upload works; camera capture is available where the tested device/browser exposes it; unsupported capture falls back to file selection.
- MOB-04: opening the virtual keyboard does not trap the user away from the active form field, validation message, or continue action.
- MOB-05: original and preview are distinguishable and inspectable on smartphone.
- MOB-06: backgrounding the browser and returning retains the draft when the browser keeps the page alive; no guarantee is made after process eviction/reload unless persistence is implemented.
- MOB-07: simulated/real network interruption exposes a recoverable state and does not create a duplicate paid job on retry/reconnect.
- MOB-08: image optimization path is evaluated on representative mobile photos and still meets analysis-quality checks.
- MOB-09: final evidence includes one real Chrome Android run and one real Safari iOS run; emulation evidence is labeled separately.

- MOB-10: in comparable screens navigation behaves consistently; where bottom navigation exists it remains consistent. Device safe areas and navigation do not cover content/CTAs.
- MOB-11: record measured text contrast against a documented design acceptance threshold before mobile acceptance is signed off; screenshot appearance alone is insufficient. The selected threshold remains a design decision.
- MOB-12: exercise Original/Possible switching in the running UI; comparison labels remain clear and motion does not introduce subject jumps through inconsistent layout/cropping. Record observed image-generation drift separately from UI movement; animation does not trigger generation.

## 9. Measurement requirements

### 9.1 Metrics

| Metric | Definition |
| --- | --- |
| Completion rate | Unique flows with a created valid brief / unique flows with valid upload. |
| Selection rate | Unique flows selecting a haircut / unique flows viewing recommendations. |
| Preview success rate | Valid preview jobs completed / preview jobs started; pending/failure reported separately. |
| Save rate | Unique flows with confirmed save / unique flows with created brief. |
| Barber usefulness | Users reporting the brief helped during an actual barber interaction / users who used the brief. |
| Repeat usage | Saved-haircut users who confirm using the brief for another haircut visit / eligible cohort over a defined window. Reopen counts are reported separately and do not establish a visit. |
| Cost per completed flow | Total provider cost for cohort attempts, including failures/retries / completed flows in that cohort. |

No target values are invented before pilot evidence.

### 9.2 Minimum events

`upload_validated`, `analysis_completed`, `recommendations_viewed`, `style_selected`, `preview_requested`, `preview_completed`, `preview_failed`, `brief_created`, `haircut_saved`, `saved_brief_reopened`.

Rules:

- unique event ID and pseudonymous flow ID;
- revision/job ID when relevant;
- retries do not create double-counted success events;
- `haircut_saved` fires only after persistence success;
- `preview_completed` fires only after a valid current output is accepted;
- no photo bytes, name, or free-text note in analytics;
- demo/sample flows are marked separately and excluded from reported real-user product outcomes;
- zero denominators display N/A; repeat cohort/window and evidence collection method are defined before reporting repeat usage.

### 9.3 Design validation evidence

Evaluate unassisted completion, original/simulation comprehension, recovery-action comprehension, and mobile brief readability with defined tasks. Record participant count, device and observed results. No numerical outcome target or user-test success is invented by this revision. Width and touch-target limits remain acceptance gates rather than business KPI targets.

## 10. End-to-end acceptance and traceability

| Test | Scenario | Requirements |
| --- | --- | --- |
| E2E-01 | Valid photo → analysis → recommendations → select → preview → brief → save → refresh → reopen | FR-01/02/03/05/07/08/11 |
| E2E-02 | Invalid/no consent → block; replace with valid photo → continue | FR-01 |
| E2E-03 | Analysis failure → photo retained → safe retry without fake output | FR-02/10 |
| E2E-04 | Preview failure → brief without preview | FR-05/07/10 |
| E2E-05 | A pending → choose B → A result cannot overwrite B | FR-03/05/10, NFR-09 |
| E2E-06 | Text/name boundary validation | FR-04/07/08 |
| E2E-07 | Save failure/double tap → draft intact, no false success/duplicate | FR-08/10 |
| E2E-08 | Quota exhausted → no new provider request | FR-10, NFR-08 |
| E2E-09 | Repeat saved haircut → zero AI attempts; delete → stays deleted after refresh | FR-08/11 |
| E2E-10 | Cross-owner/session access denied and sensitive payload absent from logs | FR-12, NFR-02/03 |
| E2E-11 | Login during save, if account mode → draft retained, no AI rerun | FR-12 |
| E2E-12 | Event de-duplication and success-only instrumentation | Section 9, NFR-07 |
| E2E-13 | 360 px mobile flow, touch targets, keyboard, original/preview inspection | NFR-01, MOB-01/02/04/05 |
| E2E-14 | Mobile background/return + refresh behavior matches documented draft guarantee | FR-10, MOB-06 |
| E2E-15 | Network interruption/reconnect does not create duplicate paid job | FR-10, MOB-07 |
| E2E-16 | Real Chrome Android and Safari iOS evidence recorded separately from emulation | NFR-10, MOB-09 |
| E2E-17 | Fresh consent unchecked; no photo transmitted before consent; copy matches configuration | AC-01.9/01.10 |
| E2E-18 | Correct hair observation; apply; invalidate dependents without silently rerunning image generation | AC-02.5/02.6, FR-10 |
| E2E-19 | Browse recommendations; image source clear; zero image generation before explicit selected preview | AC-03.4/03.5 |
| E2E-20 | Skip preferences; relative length mapping and effort definitions remain consistent | AC-04.4/04.5/04.6 |
| E2E-21 | Preview not requested/pending/failed/available/stale states and original toggle behave as specified | AC-05.7–05.10 |
| E2E-22 | Notes edit; no image call; save scope accurate; reopen and delete/cancel correct | AC-07.6/07.7, AC-08.6/08.7, AC-11.3/11.4 |
| E2E-23 | Safe areas, measured contrast and comparison motion recorded in mobile evidence | MOB-10/11/12 |

### 10.1 Release gate for functional MVP

The functional MVP is ready only when:

- required MVP FR acceptance criteria pass;
- required mobile acceptance profile passes;
- real AI is used for the intended AI capabilities in the demo build, with mocks clearly confined to development/testing;
- private access and cost controls work;
- stale-result handling works;
- persistence behavior matches the promise shown to users;
- blocking design decisions are closed;
- foundation completion evidence exists;
- event submission readiness is assessed separately; internal MVP success does not automatically mean competition submission readiness.

## 11. Open design decisions

These must remain explicit until `design.md` resolves them:

| Decision | Required before |
| --- | --- |
| Frontend framework and backend framework/language | First implementation tasks beyond existing approved scaffolding |
| Repo topology | Foundation/project scaffolding finalization |
| Google ADK version and model(s) | Real smoke/product integration |
| Analysis/recommendation schema | FR-02/03 implementation |
| Image-generation model and prompt/identity strategy | FR-05 implementation |
| Upload normalization/compression quality thresholds | FR-01 implementation completion |
| API/endpoints/job contract | Product API integration |
| Persistence mode: local vs account | FR-08/12 implementation |
| Authentication/ownership approach if account mode | Server-side saved data |
| Database/object storage and retention/backup | Persistent user data |
| Quota/concurrency/budget values | Any public/competition AI endpoint |
| Retry/reconnect/job reconciliation mechanism | FR-10 implementation |
| Exact timeout values after provider tests | Production/demo hardening |
| Final preference options, relative-length contract and effort definitions | FR-04 implementation and E2E-20 |
| Original/reference/demo image presentation; preview action labels | FR-03/05 design handoff |
| Open Brief / Repeat control presentation | FR-11 design handoff |
| Contrast acceptance threshold and comparison motion specification | MOB-11/12 acceptance |
| Numeric proposals: upload size, note/name limits, recommendation count | Relevant input validation and boundary acceptance |
| Detailed customization | Later; only reopen through an explicit scope change |
| GCP service/topology | BF-08/deployment |
| Event unresolved rules (team conflict, repo, old-code freshness/T&C) | Submission package/final roster |

## 12. AI Builder Cup 2026 parameters

**Historical source snapshot:** v0.4 reports verification on 19 September 2026. This v0.5 update does not re-verify external event rules. Every Verified label below refers only to that dated source report, not current verification; recheck official sources/dashboard before submission decisions.

### 12.1 Source status

| Source | Status on verification date | Use |
| --- | --- | --- |
| https://aibuildercup.com/ | Accessible through official indexed/cached public results, but different official snapshots contain conflicting team-size wording | Timeline, eligibility, team working rule, event overview with conflict note |
| https://aibuildercup.com/themes.html | Accessible through official indexed public result | Themes, AI/cloud requirement, submission items, language, judging weights |
| Previously referenced T&C Google document | Not accessible in this verification pass | Preserve prior notes only as needs verification; do not promote them to newly verified fact |

### 12.2 Event-rule snapshot retained from v0.4

| ID | Status | Event parameter | Source / interpretation |
| --- | --- | --- | --- |
| EVT-01 | Verified | Choose a theme; Cutback maps to **Retail & Commerce: Intelligent Customer and Business Experiences**, including discovery/personalization. | Official themes page. |
| EVT-02 | Verified | Prototype must meaningfully use Google AI models such as Gemini/Gemma or the listed Google agentic platforms and be deployed to Google Cloud using Cloud Run or Firebase according to the current themes page. | Official themes page. Google ADK remains Cutback's internal runtime choice, not an organizer mandate by name. |
| EVT-03 | Needs verification | Prior baseline said code/assets must satisfy a freshness/originality timeline rule. The previously cited T&C document could not be accessed in this pass. | Do not claim old Cutback work eligible because it is renamed/rebuilt as V2. Verify T&C/dashboard or obtain organizer clarification before reuse. |
| EVT-04 | Partially verified | Official themes page verifies functional deployed prototype, deck/PDF, and a public video link of 3 minutes. Prior baseline also required a public GitHub repo; that repo requirement was not found in the accessible official material during this pass. | Keep a public-ready repo as planned evidence, but mark mandatory status needs verification. |
| EVT-05 | Verified | Themes page states submission materials including code, documentation, and presentations must be in English. | Internal Indonesian docs are allowed as working copies; submission-facing artifacts need English versions. |
| EVT-06 | Verified with source conflict | Current indexed official overview says team **2–4**, 21+, JAPAC, working professionals/entrepreneurs/startups, students ineligible. A cached official page retrieved during the same verification still says 1–4. | Use 2–4 as current planning rule and recheck dashboard/latest T&C before roster lock. |
| EVT-07 | Verified from current indexed overview | Registration/team formation: 1 Sep–11 Oct 2026; prototype building/submission: 7 Sep–18 Oct; finalist announcement: 7 Nov; Grand Finale: 4 Dec 2026 in Singapore. | Exact cutoff hour/timezone still needs dashboard confirmation if not explicitly displayed. |
| EVT-08 | Verified | Judging weights: Technical Merit & Gen AI Implementation 40%; Problem Alignment & Impact 25%; Innovation & Creativity 25%; User Experience & Solution Design 10%. | Official themes page. |

### 12.3 Current official-page inconsistencies

- The overview has conflicting official snapshots for team size (current indexed 2–4 vs cached 1–4).
- The themes page's “Category Specification” subsection lists categories that do not match the six primary themes. Treat Retail & Commerce as Cutback's product mapping, but confirm the actual submission form field when it opens.
- The themes page states “3 minutes” for video. A stricter internal target may be chosen, but must be labeled internal unless an official source explicitly says “under 3 minutes.”

### 12.4 Cutback competition evidence gates

These are internal gates derived from the event requirements; they are not additional organizer rules.

| Gate | Cutback evidence | Acceptance |
| --- | --- | --- |
| EC-01 — Retail problem fit | Product/deck connects haircut discovery, personalization, clearer service communication, and repeat use to a customer experience in Retail & Commerce. | No invented market/user-validation claims; product value is demonstrated through the working flow and any real research actually completed. |
| EC-02 — Real AI | Real Google AI participates meaningfully in the product flow. | Demo identifies model/runtime at a non-secret level; mocks are not shown as live AI. |
| EC-03 — Allowed deployment | Competition build is deployed on the verified Google Cloud path. | Public/demo URL tested from a clean browser/device; E2E core flow works. |
| EC-04 — Work provenance | Track start dates, commits, and origin/license of code/assets used in submission. | Old assets/code are not assumed eligible until EVT-03 is resolved; provenance list contains no unresolved item at submission. |
| EC-05 — Demo story | Mobile demo shows upload → analysis/recommendations → selected preview → barber brief → save → reopen. | Barber-brief value and repeat-without-AI are visibly demonstrated; failure path may be shown only if it strengthens the story and is real. |
| EC-06 — Submission artifacts | Deck PDF, video, deployed URL, documentation, and repo/publication artifact as required by the final dashboard. | Mandatory vs optional repo status checked before submission; all required links open for judges. |
| EC-07 — English submission | Submission-facing code/documentation/presentation/video text is prepared in English as required. | Working Indonesian source docs may remain internal. |
| EC-08 — Team/time eligibility | Team size/eligibility/cutoff checked against the final dashboard/latest organizer source. | Do not mark eligible merely from this document; final team data must satisfy the then-current rule. |
| EC-09 — Safe publication | Demo assets are authorized; no private user photo, office data, credential, or secret is exposed. | Repo/history/video/deck reviewed before public release. |

### 12.5 Judging criteria mapped to product evidence

| Official criterion | Weight | Cutback evidence strategy |
| --- | ---: | --- |
| Technical Merit & Gen AI Implementation | 40% | Real Google AI use, structured output validation, duplicate-safe job handling, privacy/cost controls, architecture evidence, deployable/working system. |
| Problem Alignment & Impact | 25% | Show the actual user problem: uncertainty choosing a haircut, difficulty imagining it on oneself, ambiguous barber communication, inability to repeat a good cut. Use real pilot evidence only if collected. |
| Innovation & Creativity | 25% | Demonstrate the connected loop of personalized recommendation → selected preview → barber brief → saved haircut memory, rather than adding unrelated features. |
| User Experience & Solution Design | 10% | Mobile-first 360 px flow, clear AI-simulation labeling, camera/gallery fallback, readable brief, reliable error/retry behavior, and saved haircut reopen. |

Do not add booking, payments, AR/3D, or native Android purely to inflate the competition demo. Competition evidence should strengthen proof of the existing value proposition.

### 12.6 Submission readiness checklist

- [ ] Functional MVP release gate passes.
- [ ] EC-01 through EC-09 have actual evidence.
- [ ] Real Google AI path works in the deployed build.
- [ ] Deployment method matches the currently verified organizer rule.
- [ ] Team size/eligibility and exact cutoff are rechecked in the actual dashboard/latest T&C.
- [ ] Old code/assets provenance and freshness eligibility are resolved.
- [ ] Mandatory repo status is verified; repo is safe to publish if required.
- [ ] Video length rule is rechecked and final video stays within the verified limit.
- [ ] PDF deck, video, code/docs, and other required submission material use English where required.
- [ ] All public links are tested from a clean/incognito browser.
- [ ] No invented user validation, business impact, deployment success, or submission status appears in the materials.

## 13. Spec-driven definition of done and handoff to design

- Behavior is implemented against the active PRD/requirements, not a historical file.
- A task references the BF/FR/NFR and acceptance criteria it satisfies.
- A behavior-changing code edit must be reconciled with requirements/design/tests before merge.
- A pure refactor with no behavior change does not require a requirement rewrite.
- Mocks are allowed for development tests but cannot be presented as proof that the real AI requirement passed.
- A feature is done only when its normal path, failure path, stale/duplicate behavior, privacy/access rule, and applicable mobile acceptance criteria pass.
- Reconcile the existing design/prototype into `design.md`; inspect available work before creating replacements. Resolve each relevant Section 11 decision before its implementation task relies on it. Do not require unrelated future decisions to block a sufficiently specified slice.


## 14. PRD audit traceability and handoff

| PRD finding | Requirement / acceptance | Evidence |
| --- | --- | --- |
| AL-01 Recommendation image meaning | AC-03.4/03.5 | E2E-19 |
| AL-02 Relative length | AC-04.4 | E2E-20 |
| AL-03 Effort consistency | AC-04.5 | E2E-20 |
| AL-04 Observation correction | AC-02.5/02.6 | E2E-18 |
| AL-05 Preview labels and actions | AC-05.7–05.10, FR-10 | E2E-21 |
| AL-06 Save scope and failure | AC-08.6/08.7, FR-12 | E2E-07/22 |
| AL-07 Open versus repeat | AC-11.3/11.4 | E2E-09/22 |
| AL-08 Missing-state evidence | FR-01/02/05/08/10 | State inventory below |
| AL-09 Mobile evidence | MOB-01–MOB-12 | E2E-13–16/23 |
| AL-10 Consent and privacy claims | AC-01.9/01.10, Section 7 | E2E-17 |

Minimum state inventory for design handoff:

| State | Required response | Existing test coverage |
| --- | --- | --- |
| Invalid upload / no consent | Explain reason, preserve recoverable input, block processing | E2E-02/17 |
| Loading / pending | Identify operation, prevent duplicates, do not fabricate progress | AC-10.1, E2E-21 |
| Analysis failure | Keep photo, safe retry, no fake result | E2E-03 |
| Preview failure | Keep recommendation, retry or brief without preview | E2E-04/21 |
| Quota exhausted | Explain limit, block provider request | E2E-08 |
| Stale / late result | Identify outdated result, protect active revision | E2E-05/21 |
| Save failure | Preserve draft; no success confirmation | E2E-07/22 |
| Empty My Haircuts | Clear first-haircut action | AC-08.5 |
| Delete confirmation | Cancel preserves; confirm removes per policy | E2E-09/22 |
| Disconnect / unknown job outcome | Reconcile status before safe retry | E2E-15 |

All rows are required evidence targets, not claims of completed design or tests. Preserve existing frames where aligned; add or inspect missing states. Next work is targeted design reconciliation and repository inspection, followed by tasks referencing these IDs. PRD v0.3's earlier note that standalone requirements v0.4 was unavailable is now resolved by the user-supplied source; the PRD itself was not modified in this requirements-only update.
