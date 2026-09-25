# Cutback V2 — Implementation Model

**Status:** Proposed implementation-ready specification  
**Date:** 19 September 2026  
**Purpose:** Translate the active Cutback requirements, PRD, current wireframe, and visual direction into an executable web-app implementation model without adding new product scope.

## 0. Authority and working rules

Source priority for this document:

1. `cutback-requirements.md` v0.4 — behavior and acceptance criteria
2. `cutback-prd.md` v0.2 — product scope, intent, priorities
3. current `wireframe.png` — structural/visual anchor
4. current design guidance — visual/UX direction
5. supporting/historical documents — context only

This document does not override requirements. If implementation behavior changes, update the authoritative requirements/design/test artifacts before merge.

Core product rules carried forward:

- Mobile-first web app; smartphone is primary.
- Core flow: Upload → Validate → Analyze → Recommend → Choose → Preview → Barber Brief → Save → Reopen.
- Preferences are optional.
- Preview is generated only for the selected haircut and only after an explicit user action.
- Reopening a saved haircut does not rerun AI.
- Native Android/Play Store is later.
- Main flow must work at 360 CSS px with no horizontal scrolling.
- Important touch targets target at least 44 × 44 CSS px.
- Duplicate AI jobs, stale results, reconnects, retries, offline behavior, and save failures are first-class implementation concerns.

---

# 1. Current wireframe normalization

The current wireframe is mature enough to remain the structural visual baseline, but several frames should be implemented as states rather than independent routes.

## 1.1 Keep as real routes/pages

- Landing
- Upload
- Analysis
- Recommendations
- Preview
- Barber Brief
- My Haircuts
- Saved Haircut Detail / Reopen

## 1.2 Implement as states/subviews, not standalone routes

- Photo Validation → state within `/upload`
- Preferences → subview/panel within `/recommendations`
- Save Success → state within `/brief`
- Upload Error / No Face / AI Error / Offline → state variants within the owning page
- Recommendation detail → inline expansion or sheet within `/recommendations`

## 1.3 Wireframe elements that must not become active MVP features

Requirements override the current visual anchor in these cases:

- `Try Another Angle` / multi-angle preview → remove from active MVP.
- `Share / Download` barber brief export → Later; do not ship as an active MVP action.
- `Explore` and `Profile` bottom-nav destinations → not in current MVP requirements.
- `History` tab in My Haircuts → not required; current MVP needs saved records, reopen, and delete.
- invented traction/trust counters → do not use unless backed by real evidence.
- exact haircut measurements inferred from a photo → do not fabricate; use known recommendation details or “confirm with barber”.
- automatic/progressive AI stage checkmarks → only show stages as completed if the backend actually reports them.
- any save-success copy implying cross-device or permanent cloud availability when the selected persistence mode does not provide it.

## 1.4 Wireframe gaps that must be added

- Processing consent before sending the photo for AI work.
- Explicit AI-simulation labeling on preview.
- Clear no-preview path into Barber Brief.
- Delete action and confirmation for saved haircuts.
- Quota/limit state for paid AI actions where applicable.
- Reconnect/reconciliation state after ambiguous network failure.
- Stale-result handling when photo/preferences/selection changes.

---

# 2. Route, screen, and state map

Use a small route set. Visual substeps may fill the whole mobile viewport without becoming separate application routes.

| Route | Responsibility | Key states |
|---|---|---|
| `/` | Entry, product value, start/repeat choices | default |
| `/upload` | Pick/capture, inspect, replace, consent, trusted preflight validation | empty, selected, validating, valid, invalid, consent-missing |
| `/analysis` | Own the analysis AI job and recovery | idle/starting, pending, reconnecting, failed, succeeded |
| `/recommendations` | Show analysis summary, recommendations, optional preference refinement, selection | ready, preferences-open, updating, failed, selected, stale |
| `/preview` | Explicit preview request, job recovery, original-vs-simulation inspection | idle, pending, reconnecting, succeeded, failed, stale |
| `/brief` | Create/read current Barber Brief, edit note, save | ready, preview-unavailable, stale, saving, save-failed, save-succeeded |
| `/haircuts` | Persistent saved-haircut library | list, empty, delete-confirm, delete-failed |
| `/haircuts/[id]` | Reopen a saved snapshot without AI | ready, missing, delete-confirm |

### Route guards

- `/analysis` requires a current valid photo + consent.
- `/recommendations` requires a valid current analysis.
- `/preview` requires exactly one current selected model.
- `/brief` requires a current selected model. A preview is optional.
- `/haircuts/[id]` requires an existing accessible saved record.
- If an unsaved flow route is refreshed and required draft state no longer exists, redirect to `/upload` with a clear “Your unsaved session is no longer available” message. Do not reconstruct fake state.

---

# 3. Screen responsibilities and actions

## 3.1 Landing `/`

**Responsibility**
- Communicate Cutback’s value quickly.
- Start a new haircut flow.
- Enter the saved-haircut area.

**Primary action**
- `Find My Haircut` → `/upload`

**Secondary action**
- `Repeat My Best Cut` → `/haircuts`

**Do not**
- show unsupported trust/user counts;
- force account creation;
- expose unrelated Explore/Profile destinations.

## 3.2 Upload `/upload`

**Responsibility**
- Select or capture one image.
- Show the selected image clearly.
- Allow replacement before analysis.
- Collect consent.
- Perform non-paid trusted preflight checks.
- Surface semantic invalid-input results returned by the analysis path.

**Primary action**
- `Use This Photo` / `Analyze Photo`

Enabled only when:
- a supported image is selected;
- basic validation passes;
- consent is accepted.

**Secondary actions**
- `Choose another photo`
- `Take a photo` where supported

**Local/non-paid checks**
- file present;
- decodable image;
- supported content type;
- configured byte limit;
- basic dimension sanity if defined by design.

Do not spend a separate paid AI request solely to duplicate checks already required by the analysis call unless a later design explicitly justifies it.

## 3.3 Analysis `/analysis`

**Responsibility**
- Start or reconcile one logical analysis job for the current photo revision.
- Show indeterminate loading/progress safely.
- Accept structured schema-valid result.
- Route usable results to recommendations.
- Return inadequate visual input to upload.

**Primary actions**
- none while pending;
- `Try Again` after terminal failure.

**Secondary action**
- `Back` → `/upload`

Leaving this route does not promise cancellation of an upstream request.

## 3.4 Recommendations `/recommendations`

**Responsibility**
- Show the current analysis summary.
- Allow correction of supported hair observations.
- Show a small set of materially different recommendations.
- Explain Best Match without fake certainty.
- Keep reference images distinct from personal preview.
- Allow one active model.
- Host optional preferences without forcing a separate route.

**Primary action**
- after selection: `Preview This Cut` → starts one explicit preview job and navigates to `/preview`.

**Secondary actions**
- `Preferences` → open full-screen mobile subview/panel on the same route.
- `Change selection`
- `Edit analysis observations` where supported.

**Preferences behavior**
- editing controls is local only;
- `Apply Preferences` explicitly requests refreshed recommendations;
- `Skip/Close` creates zero AI attempts.

If preferences are presented as a full-screen mobile subview, represent it in history with a query/state entry such as `/recommendations?panel=preferences` so browser Back closes the panel before leaving recommendations.

## 3.5 Preview `/preview`

**Responsibility**
- Reconcile or display the preview job for the selected model/revision.
- Compare original photo vs AI simulation.
- Prevent stale preview from becoming current.
- Allow retry after terminal failure.
- Allow continuing without preview.

**Primary action on success**
- `Continue to Barber Brief` → `/brief`

**Secondary**
- `Choose Another Style` → `/recommendations`

**Failure actions**
- `Retry Preview`
- `Continue Without Preview`

**Comparison pattern**
- Keep the current before/after comparison direction.
- Use explicit labels `Original` and `AI Preview`.
- The comparison control must be keyboard/touch operable and usable at 360 px.
- No multi-angle generation in MVP.

## 3.6 Barber Brief `/brief`

**Responsibility**
- Build a readable, structured brief from current selected-model data and user note.
- Include preview only when a current valid preview exists.
- Use `confirm with barber` for unknown/unreliable detail.
- Prevent stale brief from being saved as current.
- Save the snapshot.

**Primary action**
- `Save to My Haircuts`

**Secondary**
- back to `/preview` when a current preview exists;
- otherwise back to `/recommendations`.

**Save success**
- state within `/brief`, not a new route.
- actions: `View My Haircuts` and `Back to Home`.

Do not expose active Share/Download in the current MVP.

## 3.7 My Haircuts `/haircuts`

**Responsibility**
- Show durable saved records.
- Handle empty library.
- Open a saved haircut.
- Delete with confirmation.

**Primary action per item**
- open `/haircuts/[id]`

**Empty-state action**
- `Find My Haircut` → `/upload`

**No MVP requirement for**
- History tab
- favorite
- rename
- account sync

## 3.8 Saved Haircut `/haircuts/[id]`

**Responsibility**
- Reopen the saved brief/snapshot.
- Show saved date/context.
- Use stored images and brief data.
- Perform zero AI attempts for reopen.
- Allow delete.

The baseline action is “show/repeat this saved cut”. Do not silently run a new analysis or preview.

---

# 4. Back and navigation behavior

Use browser history as the default truth and keep application Back aligned with it.

| Current context | Back destination / behavior |
|---|---|
| `/upload` | `/` |
| upload validation substate | remain `/upload`; return to selected-photo/edit state |
| `/analysis` | `/upload`; running server job may continue |
| preferences subview | close preferences, remain `/recommendations` |
| `/recommendations` | `/upload`; retain draft while session is alive |
| `/preview` | `/recommendations` |
| `/brief` | `/preview` if current preview exists, otherwise `/recommendations` |
| save-success state | return to brief content or use explicit CTA |
| `/haircuts` | `/` |
| `/haircuts/[id]` | `/haircuts` |

Rules:

- Back/navigation never starts a paid AI request.
- Completed current results are reused when returning.
- A late job result may be stored for reconciliation but cannot force navigation or replace newer current state.
- If the user changes photo/model/preferences, route-level guards use the newest revision only.

---

# 5. Reusable UI patterns/components

Keep the component set small and semantic.

## Navigation

- `FlowHeader`
  - back
  - title/brand
  - optional contextual action
- `AppNav`
  - only for stable app areas if needed
  - MVP destinations should not exceed actual product scope

## Actions

- `Button`
  - primary / secondary / tertiary / destructive
  - default / pressed / focus / loading / disabled
- `StickyActionArea`
  - optional mobile bottom CTA pattern with safe-area handling

## Photo/media

- `PhotoPicker`
- `PhotoFrame`
  - original / reference / AI-preview variant
- `PhotoLabel`
- `CompareSlider`
- `ImageFallback`

## Validation/status

- `InlineMessage`
- `ValidationChecklist`
- `JobStatusPanel`
  - loading / error / offline / reconnecting / quota / stale
- `NetworkBanner`
- `EmptyState`

## Selection/form

- `PreferenceGroup`
- `SelectionControl`
- `TextArea`
- `ConsentControl`

Use pills only where the choice model genuinely benefits from compact mutually exclusive options.

## Recommendations

- `RecommendationPrimary`
- `RecommendationAlternative`
- `RecommendationDetails`
- `SelectionIndicator`

## Barber Brief

- `BriefHeader`
- `BriefMedia`
- `BriefDetailRow`
- `BriefSection`
- `UnknownDetail`
- `BriefNote`

## Saved records

- `SavedHaircutItem`
- `SavedHaircutHero`
- `ConfirmDialog`

Avoid page-specific “CardX” components when the underlying pattern is reusable.

---

# 6. Client state and logical data contract

## 6.1 Active draft

A single active `FlowDraft` is sufficient for MVP.

Suggested logical shape:

```text
FlowDraft
- flowId
- revisionId
- createdAt
- updatedAt

- consent
  - accepted
  - acceptedAt
  - consentVersion

- photo
  - localFile/blob
  - localPreviewUrl
  - serverRef?              # only if the design uploads/stores temporarily
  - mimeType
  - byteSize
  - width?
  - height?
  - validationStatus
  - validationError?

- analysis
  - status
  - sourceRevisionId
  - jobId?
  - schemaVersion?
  - modelVersion?
  - observations
  - unknownAttributes[]
  - userCorrections

- preferences
  - vibe?
  - desiredLength?
  - stylingEffort?
  - note?

- recommendations
  - status
  - sourceRevisionId
  - jobId?
  - items[]
  - generatedAt?

- selectedModelId?

- preview
  - status
  - sourceRevisionId
  - selectedModelId
  - jobId?
  - imageRef/blob?
  - error?

- brief
  - status
  - sourceRevisionId
  - selectedModelSnapshot
  - detailRows[]
  - note?
  - previewRef?
  - createdAt?

- save
  - status
  - recordId?
  - error?
```

## 6.2 Revision/invalidation rules

Use a monotonic revision ID or equivalent immutable revision key.

- Replace valid photo → invalidate analysis and everything downstream.
- Correct analysis or apply preferences → invalidate recommendations, selection, preview, brief.
- Change selected model → invalidate preview and brief only.
- Edit brief note → update brief annotation only; preview remains valid.
- Reopen saved record → use its snapshot; never merge it into a different active unsaved draft silently.

Derived artifacts must record the revision/model that created them.

## 6.3 Saved haircut snapshot

A saved record must contain enough durable data to reopen after refresh with zero AI calls.

Minimum logical snapshot:

```text
SavedHaircut
- id
- name
- savedAt
- schemaVersion
- selectedModelSnapshot
- briefSnapshot
- originalPhotoBlobOrDurableRef
- previewBlobOrDurableRef?
- previewAvailable
- relevant preference/analysis context needed to explain the saved brief
- sourceRevisionMetadata
```

Never persist a temporary browser object URL as the saved image reference.

---

# 7. AI request boundaries

Treat paid/provider-bound work as explicit operations.

| Operation | Trigger | Paid AI? | Duplicate rule | Result use |
|---|---|---:|---|---|
| preflight file validation | select/continue | No | N/A | block bad file before AI |
| analysis | valid photo + consent + explicit continue | Yes | one pending logical job | structured observations or semantic invalid-input outcome |
| recommendations | valid analysis; initial request or explicit apply after corrections/preferences | Yes | one pending logical job per source revision | recommendation set |
| preview | user explicitly chooses Preview This Cut for one selected model | Yes | one pending logical job per selected-model revision | one AI simulation |
| barber brief composition | valid selected model | No by default | N/A | deterministic structured brief |
| save | explicit save | No AI | idempotent save | durable snapshot |
| reopen/repeat | open saved record | No AI | N/A | stored snapshot |

### 7.1 Do not spend AI on navigation

The following create zero provider attempts:

- opening/closing Preferences;
- browser/app Back;
- opening Recommendations again;
- opening a completed Preview again;
- opening Barber Brief;
- save;
- reopen;
- repeat.

### 7.2 Job/idempotency contract

Every provider operation needs:

```text
logicalOperationKey
jobId
operationType
flowId
revisionId
selectedModelId?    # preview
status              # pending | succeeded | failed
attemptCount
createdAt
updatedAt
errorCode?
providerMetadata?   # non-secret
```

Recommended duplicate behavior:

1. Client sends an idempotency/logical-operation key.
2. If the same logical operation is already pending, server returns the existing job.
3. If it already succeeded for the current revision, server returns/reuses the accepted result.
4. A terminal failure may be manually retried.
5. Retry creates a controlled new attempt and remains linked to the previous job.
6. After timeout/disconnect with ambiguous outcome, client first asks for the known job status.
7. Do not create a new provider attempt until the previous job is known terminal or the server explicitly authorizes retry.

### 7.3 Late/stale response rule

On every result acceptance:

```text
if result.revisionId != activeRevisionId:
    mark result stale
    do not replace current UI artifact
```

Preview also checks `selectedModelId`.

---

# 8. Draft, save, and reopen behavior

## 8.1 Unsaved draft

Baseline guarantee:

- survives in-app route navigation while the app session remains alive;
- should survive temporary mobile app switching if the browser keeps the page alive;
- is not promised across hard refresh/tab close/process eviction/device restart.

Implementation may use in-memory application state plus temporary browser objects.

Do not write UI copy such as “we’ll keep your draft forever” unless a stronger persistence mechanism is implemented and tested.

## 8.2 Saved record

Save success is shown only after durable persistence succeeds.

On failure:

- retain the current brief/draft;
- show a recoverable error;
- do not emit `haircut_saved`;
- do not clear the draft.

## 8.3 Persistence decision still required

Before FR-08 implementation starts, technical design must lock one mode:

### Option A — local-device/browser MVP
Recommended for minimum hackathon dependency:
- use durable browser storage capable of storing image blobs/references, e.g. IndexedDB;
- no login wall;
- UI says saved on this browser/device;
- no cross-device sync promise.

### Option B — account/server persistence
- requires auth/ownership design;
- requires server database/object storage and retention policy;
- saved record access must enforce ownership server-side.

Do not implement both modes for MVP unless there is a concrete need.

---

# 9. Loading, error, offline, retry, and stale states

## 9.1 Loading

- show loading feedback promptly;
- use indeterminate progress unless backend has real measurable stages;
- disable the action that would duplicate the same pending operation;
- keep Back available when safe.

## 9.2 Upload/preflight error

Examples:
- unsupported/corrupt file;
- configured size limit exceeded;
- decode failure.

Behavior:
- specific nearby message;
- no AI attempt;
- selected valid previous draft is not silently destroyed.

## 9.3 Semantic photo rejection

Examples:
- no usable face;
- multiple people;
- hair/face not sufficiently visible.

Behavior:
- return to `/upload`;
- explain what to change;
- retain ability to choose another photo;
- do not show fake analysis/recommendations.

## 9.4 Analysis/recommendation/preview provider failure

- retain upstream valid state;
- show terminal error;
- enable manual retry;
- retry respects quota and job reconciliation.

## 9.5 Offline before request

- do not start a provider request;
- show offline state;
- enable retry after connectivity returns.

## 9.6 Disconnect after request may have started

- show `Checking request status…`;
- reconcile by job ID;
- never silently send the same paid operation again.

## 9.7 Stale result

A stale result may be retained internally for diagnosis/history but cannot be presented as current.

If stale recommendations remain visible during refresh:
- label them `Updating / previous result`;
- disable selection from the stale set.

If a stale preview finishes:
- do not replace the current preview;
- do not navigate the user.

## 9.8 Quota/limit reached

- server rejects before provider invocation;
- show clear reason;
- no hidden retry loop;
- no default unlimited generation.

---

# 10. Mobile-first and responsive constraints

## 10.1 Primary widths

- 360 px — minimum acceptance width
- 390 px — primary design width
- 430 px — larger phone validation

## 10.2 Layout

For focused flow pages:

- one primary content column;
- no horizontal page scrolling;
- width fills the viewport minus side padding;
- desktop may center the mobile content in a max-width column or use a simple split layout where photography benefits;
- do not turn desktop into a dashboard.

## 10.3 Touch and safe areas

- important controls: minimum target 44 × 44 CSS px;
- bottom CTA areas account for `env(safe-area-inset-bottom)`;
- avoid placing critical controls under browser/OS chrome.

## 10.4 Keyboard

- focused input/textarea must scroll into view;
- nearby validation remains visible/reachable;
- Continue/Apply/Save must not become permanently inaccessible while the virtual keyboard is open;
- verify on real Android Chrome and iOS Safari.

## 10.5 Images

- original and AI preview must be distinguishable by label, not only position/color;
- preserve inspectable image size at 360 px;
- use responsive width, no overflow;
- dark hair must remain visually distinguishable from dark UI backgrounds.

## 10.6 Text/content resilience

Test:
- long haircut names;
- longer rationale;
- dynamic error copy;
- 500-character note;
- large-text/browser zoom scenarios;
- no critical text clipped.

---

# 11. Blocking implementation decisions

The flow/state model above can be implemented without inventing product behavior, but coding tasks must not assume the following until technical design locks them.

| Decision | Needed before |
|---|---|
| approved frontend framework / current scaffold | route/component implementation |
| backend framework/language compatible with chosen ADK runtime | BF-01/BF-03 |
| repo topology | BF-01 |
| Google ADK version + model identifiers | BF-03 / product AI |
| analysis/recommendation structured schema | FR-02/03 |
| image-generation model and identity-preservation strategy | FR-05 |
| upload byte/dimension/compression thresholds | FR-01 completion |
| API + job/status/idempotency contract | product integration |
| persistence mode (local vs account) | FR-08/12 |
| storage implementation and retention | saved/server data |
| quota/concurrency/budget values | any public paid endpoint |
| timeout/reconnect rules after provider testing | FR-10 hardening |
| exact GCP deployment topology | BF-08 |

### Recommended scope simplification

Unless another requirement is promoted before implementation:

- choose one persistence mode;
- keep Barber Brief deterministic rather than adding another AI call;
- keep Preferences inside Recommendations;
- keep Photo Validation inside Upload;
- keep Save Success inside Brief;
- do not implement Explore/Profile/History/multi-angle/export/favorite/rename.

---

# 12. Development task breakdown

Tasks should be executed in this order and reference the requirement/acceptance IDs in commit/task descriptions.

## T0 — Lock technical design decisions

Deliver:
- framework/runtime decision;
- repo topology;
- ADK/model decision;
- API/error/job contract;
- persistence mode;
- GCP target;
- structured schemas.

**Gate:** no product coding agent should invent these decisions.

## T1 — Backend foundation

Implement BF-01 through BF-09:

- local setup;
- server health;
- real ADK smoke path;
- environment config;
- consistent response/error contract;
- logging/privacy baseline;
- foundation tests;
- GCP packaging;
- coding-agent skill provenance.

**Gate:** real ADK smoke succeeds before foundation is marked complete.

## T2 — Frontend application shell and flow state

Implement:

- route set from Section 2;
- route guards;
- `FlowDraft`;
- revision/invalidation utility;
- browser Back behavior;
- reusable base controls/status patterns;
- 360 px shell.

Use mocks/stubs only for development and label them as such.

References:
- NFR-01
- FR-10 draft/navigation
- MOB-01/02/04

## T3 — Slice A: Upload + analysis

Implement:

- gallery/file input;
- camera hint/capture where supported;
- local inspection/replace;
- consent;
- trusted preflight validation;
- analysis job integration;
- semantic invalid-input handling;
- schema validation;
- analysis retry/reconnect;
- event instrumentation.

References:
- FR-01
- FR-02
- FR-10
- MOB-03/05/06/07/08

Acceptance focus:
- AC-01.x
- AC-02.x
- AC-10.1/4/6

## T4 — Slice B: Recommendations + optional preferences + selection

Implement:

- recommendation schema/UI;
- Best Match explanation;
- reference-image labeling;
- one active selection;
- preferences subview;
- explicit Apply;
- recommendation refresh/invalidation;
- stale protection.

References:
- FR-03
- FR-04
- FR-10

Acceptance focus:
- AC-03.x
- AC-04.x
- AC-10.3

## T5 — Slice C: Preview

Implement:

- explicit selected-model request;
- idempotent job;
- pending/reconnecting/failed/succeeded states;
- late-result rejection;
- original vs AI comparison;
- continue-without-preview;
- visual quality review hook/evidence.

References:
- FR-05
- FR-10
- NFR-11
- MOB-05/07

Acceptance focus:
- AC-05.1–05.6
- AC-10.1/3/4/5/6

## T6 — Slice D: Barber Brief

Implement:

- deterministic brief composition;
- selected model snapshot;
- preview-optional behavior;
- unknown/confirm-with-barber handling;
- note validation;
- stale brief protection;
- 360 px readable layout.

References:
- FR-07
- NFR-01

Acceptance focus:
- AC-07.1–07.5

## T7 — Slice E: Save + My Haircuts + reopen + delete

Implement against the one locked persistence mode:

- idempotent save;
- real durable images/references;
- save-failure recovery;
- save-success state;
- list/empty state;
- detail/reopen;
- delete confirmation;
- refresh persistence;
- zero-AI reopen.

References:
- FR-08
- FR-11
- FR-12 as applicable
- FR-10

Acceptance focus:
- AC-08.x
- AC-11.1
- AC-12.1/2 or account-mode criteria

## T8 — Cross-flow hardening

Implement/verify:

- offline states;
- ambiguous-timeout reconciliation;
- quota exhaustion;
- stale result tests;
- sensitive-data-free logs/analytics;
- keyboard behavior;
- 360/390/430 responsive checks;
- Android Chrome and iOS Safari real-device evidence.

References:
- NFR-01–11
- MOB-01–09
- E2E-01–16

## T9 — GCP validation and competition evidence

- deploy allowed build;
- verify from clean browser/device;
- run E2E core flow;
- capture architecture/AI evidence;
- verify public asset/repo safety;
- prepare English submission-facing artifacts.

Do not expand product scope solely for the demo.

---

# 13. Minimum coding-agent acceptance contract

A coding agent should not mark a feature complete unless:

1. The task references its BF/FR/NFR/AC IDs.
2. Happy path passes.
3. Failure path passes.
4. Duplicate click behavior is tested where paid/save operations exist.
5. Stale/late response behavior is tested where derived AI artifacts exist.
6. Privacy/logging rule is respected.
7. Applicable mobile acceptance passes at 360 px.
8. No mock is presented as real AI evidence.
9. Spec and implementation remain synchronized.

---

# 14. Recommended next artifact

This document should become the bridge between product/design and code.

Recommended repository artifact:

`implementation-spec.md`

After the technical decisions in Section 11 are locked, derive:

`tasks.md`

Do **not** write `tasks.md` first while framework, job contract, persistence mode, AI schemas/models, and GCP topology are still ambiguous.

The immediate next action is therefore:

**Lock the Section 11 decisions in the technical design, then generate `tasks.md` directly from Sections 12–13 and the authoritative requirement IDs.**
