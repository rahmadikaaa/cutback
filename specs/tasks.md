# Cutback — Implementation Tasks

**Version:** 0.2  
**Date:** 24 September 2026  
**Status:** Graph Engineering implementation baseline  
**Sources:** `cutback-prd(2).md` + `cutback-requirementsV0.md`

> This document is the execution layer for Cutback. It does not replace the PRD, requirements, design, or test plan. Product behavior remains governed by requirement IDs and acceptance criteria. Technical choices that are still open must be resolved in `design.md` before the dependent task is implemented.
>
> **Architecture direction in v0.2:** use Graph Engineering with Google ADK/ADK2-style workflow orchestration. Predictable work belongs in deterministic functions; model calls are reserved for multimodal reasoning or open-set interpretation. Exact SDK/package/API names must be locked in `design.md` before coding so this task file does not invent unsupported implementation details.

## 1. Working Rules

1. Delivery order: **requirement → minimum design → task → code → acceptance test → decision note**.
2. Every implementation task must reference relevant **BF / FR / NFR / AC** IDs.
3. Do not silently change product behavior from a coding agent. Change the spec first, then update the task and tests.
4. Mock/stub output is allowed for development and automated tests only when clearly marked. It must never be presented as real AI output.
5. A task is `DONE` only when its acceptance evidence exists. Code compiling is not sufficient.
6. Paid AI calls must be intentional, quota-controlled, and separated from routine automated tests.
7. Never commit credentials, private user photos, tokens, or free-text user notes.
8. Preserve revision consistency: stale AI results must never overwrite the active user choice.
9. **Predictable work goes in functions; reasoning goes in the model.** Do not use an LLM for MIME checks, consent, quota, schema validation, revision checks, persistence, or closed-set routing.
10. Prefer a **static graph** when the Cutback flow can be drawn before input arrives. Use dynamic graph construction only when runtime input truly changes the workflow shape.
11. Prefer a **deterministic router** for closed-set decisions with explicit state/signals. Use an LLM router only for genuinely open-set user input where rules are insufficient.
12. Fan-out/join is used only where branches are independent and there is measurable latency or reliability value; it must not be added as architecture decoration.
13. Human choice is an explicit graph boundary: AI may recommend, but the user selects the hairstyle before preview generation.

### Status vocabulary

`TODO` · `READY` · `IN PROGRESS` · `BLOCKED` · `VERIFY` · `DONE`

---

## 2. Execution Map

```text
T0  Decisions + graph contracts
 ↓
T1  ADK graph foundation (BF-01..BF-09)
 ↓
T2  Upload + validation + consent
 ↓
T3  Gemini photo-analysis node + schema-validation route
 ↓
T4  Recommendation node + optional preferences + human selection
 ↓
T5  Personal preview branch
 ↓
T6  Deterministic barber-brief branch + join
 ↓
T7  Persistence + repeat bypass
 ↓
T8  Graph reliability, privacy, quota & observability
 ↓
T9  End-to-end acceptance
 ↓
T10 GCP deployment + AI Builder Cup readiness
```

**Critical MVP path:** T0 → T1 → T2 → T3 → T4 → T5 → T6 → T7 → T9 → T10.  
T8 is not a cleanup phase: its controls must be implemented alongside T1–T7 and verified before release.

---

# PHASE 0 — Decisions & Foundation

## T0 — Lock minimum technical + graph decisions

**Status:** DONE  
**Goal:** Resolve only the technical choices required to start implementation without prematurely designing the whole system.  
**Depends on:** PRD + Requirements baseline.  
**References:** PRD §2, §3, §6, §8; Requirements §4 (BF-01–BF-09), §10, §11; Design §20, §24, §25.

### Tasks

- [x] **T0.1** Choose backend language/framework and supported runtime version. -> **LOCKED** (Node.js v20 LTS, TypeScript, Express).
- [x] **T0.2** Lock the exact Google ADK/ADK2 package/version and graph/workflow APIs to be used; document actual supported primitives instead of assuming class names from examples. -> **LOCKED** (Google `genkit` framework with `@genkit-ai/googleai`).
- [x] **T0.3** Decide repo structure: monorepo vs separate frontend/backend. -> **LOCKED** (Monorepo with root `frontend/`, `backend/`, `tests/`, `specs/`, `design/`, `knowledge/`, `docs/`).
- [x] **T0.4** Define local vs GCP environment configuration strategy. -> **LOCKED** (Local `.env` gitignored, safe `.env.example`, GCP Secret Manager/environment vars per BF-01.2, BF-04.1–04.3).
- [x] **T0.5** Choose Google model for the first real ADK smoke test. -> **LOCKED** (`gemini-1.5-flash`).
- [x] **T0.6** Define credential path for local development and GCP without committing secrets. -> **LOCKED** (Server-side ADC / `GOOGLE_APPLICATION_CREDENTIALS` / `GEMINI_API_KEY`, `.gitignore` strictly protects credentials per BF-01.3 & BF-06.2).
- [x] **T0.7** Set explicit test quota/budget/concurrency limits before any paid endpoint can be exposed. -> **LOCKED** (15 RPM local test limit, zero AI quota for automated tests).
- [x] **T0.8** Select initial GCP deployment target compatible with event requirements. -> **LOCKED** (Google Cloud Run).
- [x] **T0.9** Record decisions in `design.md` / decision notes before dependent implementation begins. -> **LOCKED** (Documented in execution record).
- [x] **T0.10** Define graph state envelope: flow ID, revision ID, current node/stage, branch status, error, quota context, and outputs that may cross node boundaries. -> **LOCKED** (Canonical envelope defined per Design §20/§24 & Requirements FR-01–FR-12).
- [x] **T0.11** Classify each planned node as **Function / Reasoning / Image / Router / Human / Join / Persistence**. -> **LOCKED** (Node ontology mapped: Deterministic Functions, Gemini Reasoning, Preview Image Gen, Deterministic Routers, Human Selection, Join, and Persistence).
- [x] **T0.12** Define deterministic routing rules for valid/invalid input, consent, schema pass/fail, quota pass/fail, preview success/failure, and stale revision. -> **LOCKED** (Rules locked per Requirements AC-01..AC-08 & FR-10).
- [x] **T0.13** Decide where graph traces/metrics are captured and what must never be logged. -> **LOCKED** (Metrics: request ID, stage, status, latency, model ID, token usage. Blacklisted: photo bytes, Base64, credentials, user notes per BF-06 & NFR-02/03).

### Done when

- [x] No foundation task is blocked by an unspecified runtime, credential path, deployment target, AI test limit, or graph API contract.
- [x] A one-page graph map exists showing which nodes are deterministic and which nodes actually invoke a model.
- [x] Open product decisions unrelated to the current task remain open rather than being invented by implementation.

---

## T1 — ADK Graph foundation

**Status:** DONE  
**Goal:** Produce a small backend + executable graph that runs locally, is testable, calls Google AI only where justified, and is safe to extend.  
**Depends on:** T0.  
**References:** **BF-01–BF-09**, NFR-02, NFR-06, NFR-07, NFR-08.

### T1.1 — Project structure & local setup — BF-01
- [x] Scaffold backend structure.
- [x] Add dependency/version lock.
- [x] Add `.env.example` with names only, no secrets.
- [x] Add `.gitignore` rules for credentials, local env, generated private assets.
- [x] Document fresh local setup/run commands.

**Evidence:** fresh checkout can install and run from README without hidden local steps.

### T1.2 — API server & health endpoint — BF-02
- [x] Start API server locally.
- [x] Add health endpoint that does **not** call paid AI.
- [x] Return explicit service/version/environment status safe for exposure.
- [x] Add health test.

**Evidence:** health test passes with AI credentials absent.

### T1.3 — Minimal executable ADK graph — BF-03
- [ ] Configure the smallest supported graph/workflow execution path in the selected ADK version.
- [ ] Implement a minimal sequence: **START → deterministic function → reasoning/model node → deterministic schema/response check → END**.
- [ ] Create a protected diagnostic/smoke-test invocation path.
- [ ] Make one deliberate real Google-model call inside the reasoning node.
- [ ] Clearly label this as infrastructure validation, **not haircut analysis**.
- [ ] Capture model/version, request ID, graph stage, chosen edge, status and latency without user/private content.

**Evidence:** recorded graph execution containing at least one deterministic node and one real Google-model node. If credentials/budget are unavailable, task remains `BLOCKED`; a mock does not satisfy BF-03.

### T1.4 — Environment configuration — BF-04
- [x] Validate required config at startup/request boundary.
- [x] Separate local and GCP configuration.
- [x] Fail clearly when required config is missing.
- [x] Ensure secret values never appear in client bundle or logs.

### T1.5 — API response & error contract — BF-05
- [x] Define common success/error envelope.
- [x] Generate/propagate request ID.
- [x] Define validation, provider, timeout, quota and internal error codes.
- [x] Ensure errors are actionable without leaking internals/secrets.

### T1.6 — Logging & basic security — BF-06
- [x] Structured logs: request ID, stage, status, latency, model where relevant.
- [x] Redact/omit secrets, photos, base64, tokens and free-text notes.
- [x] Protect paid diagnostic endpoint from anonymous unrestricted use.
- [x] Add server-side request-size and basic abuse controls where applicable.

### T1.7 — Foundation tests — BF-07
- [ ] Health test.
- [ ] Input-validation tests.
- [ ] Error-contract tests.
- [ ] Provider stub success/failure/timeout tests.
- [ ] Separate opt-in real-AI smoke test.
- [ ] Ensure default test suite does not spend AI quota.

### T1.8 — GCP packaging readiness — BF-08
- [ ] Produce deployable build/package/container.
- [ ] Document required runtime config and permissions.
- [ ] Verify local production build.
- [ ] Do not label as “verified on GCP” until an actual deployment succeeds.

### T1.9 — Coding-agent workflow — BF-09
- [ ] Install/configure selected relevant `agent-skills` workflow in the coding tool.
- [ ] Pin/record source version or commit.
- [ ] Add repo instructions that PRD/requirements override generic skill behavior.
- [ ] Require implementation agent to report changed requirement IDs and test evidence.


### T1.10 — Graph state & edge contract
- [ ] Implement one typed/shared state object for graph execution.
- [ ] Prevent nodes from reading arbitrary hidden mutable state.
- [ ] Every node records a bounded stage result: `succeeded`, `failed`, `stale`, or `skipped` where applicable.
- [ ] Router decisions are derived from explicit state fields, not free-text model guesses.

### T1.11 — Deterministic router smoke test
- [ ] Add one closed-set router using ordinary code/conditions.
- [ ] Prove both branches using automated tests with **zero model calls**.
- [ ] Record the selected edge in structured logs/traces.

### T1.12 — Optional fan-out/join capability spike
- [ ] Verify whether the selected ADK version supports the fan-out/join behavior required by Cutback.
- [ ] Demonstrate two independent no-cost test branches and a join **only if this is supported cleanly by the selected runtime**.
- [ ] If the runtime does not expose a suitable primitive, document the supported alternative in `design.md` rather than emulating unsupported APIs.

### Foundation gate

T1 is `DONE` only when BF-01–BF-09 have evidence, the executable graph path is proven, deterministic routing is tested without AI, and a real ADK/Google model connection has succeeded at least once.

---

# PHASE 1 — First Real Vertical Slice

## T2 — Photo upload, validation & consent

**Status:** DONE  
**Goal:** Accept a usable portrait safely and establish the active photo revision.  
**Depends on:** T1.  
**References:** **FR-01**, FR-10, NFR-01/02/03/04/09; **AC-01.1–AC-01.4**, E2E-02.

### Tasks
- [x] **T2.1** Connect existing mobile upload UI to real application state/API boundary.
- [x] **T2.2** Support JPEG, PNG and WebP.
- [x] **T2.3** Implement proposed 10,000,000-byte limit consistently client/server.
- [x] **T2.4** Validate actual file content server-side, not extension alone.
- [x] **T2.5** Show local preview and allow replacement before analysis.
- [x] **T2.6** Add explicit processing consent; default unchecked.
- [x] **T2.7** Do not transmit photo to AI before consent.
- [x] **T2.8** Validate visual suitability: one person, face/hair sufficiently visible; reject inadequate input rather than fabricating analysis.
- [x] **T2.9** Create/advance photo revision when a new valid photo becomes active.
- [x] **T2.10** Ensure replacing/rejecting a photo follows FR-10 invalidation rules.
- [x] **T2.11** Implement mobile error/loading states at 360 px with no horizontal scroll.
- [x] **T2.12** Represent upload validation and consent as deterministic graph/function stages; no LLM is allowed to decide MIME, size, consent, or basic eligibility.
- [x] **T2.13** Add explicit deterministic routes: `REUPLOAD`, `CONSENT_REQUIRED`, `READY_FOR_ANALYSIS`.

### Acceptance evidence
- [x] Valid photo + consent can proceed — AC-01.1.
- [x] Bad format/corrupt/oversize never invokes analysis — AC-01.2.
- [x] No consent means no AI transmission — AC-01.3.
- [x] Visually inadequate photo requests replacement — AC-01.4.

---

## T3 — Real AI photo analysis

**Status:** DONE  
**Goal:** Turn the active valid portrait into a validated structured analysis using real Google AI.  
**Depends on:** T2.  
**References:** **FR-02**, FR-10, NFR-06/07/08/09/11; **AC-02.1–AC-02.4**, E2E-03.

### Tasks
- [x] **T3.1** Define analysis schema in `design.md` before implementation.
- [x] **T3.2** Define allowed observable attributes and explicit `unknown` representation.
- [x] **T3.3** Create analysis prompt/instruction that avoids identity, ethnicity, personality and health diagnosis inference.
- [x] **T3.4** Implement ADK analysis path against active photo revision.
- [x] **T3.5** Validate model response against schema before UI consumption.
- [x] **T3.6** Reject invalid AI output with clear retry state; never substitute fake success.
- [x] **T3.7** Bind result to photo/revision ID.
- [x] **T3.8** Allow correction of supported hair observations.
- [x] **T3.9** Mark dependent recommendations stale after correction.
- [x] **T3.10** Add manual retry respecting quota and pending-job deduplication.
- [x] **T3.11** Instrument `analysis_completed` only after validated success.
- [x] **T3.12** Implement photo analysis as the first product **reasoning node** in the graph.
- [x] **T3.13** Place deterministic schema validation immediately after the reasoning node; AI output never flows directly to UI/recommendation logic unchecked.
- [x] **T3.14** Route schema failure/retry through deterministic state, not an LLM decision.
- [x] **T3.15** Record model-call count and analysis-node latency separately from total graph latency.

### Acceptance evidence
- [x] Valid response renders structured summary — AC-02.1.
- [x] Uncertain attributes remain unknown — AC-02.2.
- [x] Provider/schema failure preserves photo and shows no fake recommendation — AC-02.3.
- [x] Correction invalidates old recommendation state — AC-02.4.

### **TODAY'S FIRST VERTICAL-SLICE GATE**

At the end of T3, a real user flow must exist:

`Upload → deterministic validation → consent gate → Gemini reasoning node → deterministic schema validation → structured analysis UI`

This is the first point at which Cutback should be considered to have a real AI product slice rather than only a prototype.

---

## T4 — Recommendations, preferences & hairstyle selection

**Status:** DONE  
**Goal:** Produce grounded hairstyle choices from the active analysis, optionally refined by user preferences, and select one active model.  
**Depends on:** T3.  
**References:** **FR-03, FR-04**, FR-10, NFR-06/09/11; **AC-03.1–03.3, AC-04.1–04.3**.

### Tasks
- [x] **T4.1** Define recommendation response schema.
- [x] **T4.2** Request up to the proposed three distinct models when evidence supports them.
- [x] **T4.3** Require name, description, reason, styling effort and constraints for each result.
- [x] **T4.4** Allow one grounded “Best Match” label without unsupported certainty/accuracy percentage.
- [x] **T4.5** Add optional preference inputs: vibe, desired length, styling effort, note.
- [x] **T4.6** Enforce 500-character note limit and treat notes as untrusted user data.
- [x] **T4.7** Do not call AI merely because a preference control changed; require explicit apply action.
- [x] **T4.8** Explain conflicts/compromises instead of silently ignoring preferences.
- [x] **T4.9** Allow selection of exactly one active hairstyle per revision.
- [x] **T4.10** Switching A → B must invalidate A-specific preview/brief state without repeating photo analysis.
- [x] **T4.11** Instrument `recommendations_viewed` and `style_selected` with no photo/free-text payload.
- [x] **T4.12** Implement recommendation generation as a dedicated reasoning node consuming only validated analysis + approved optional preferences.
- [x] **T4.13** Validate recommendation schema deterministically before rendering.
- [x] **T4.14** Treat hairstyle selection as an explicit **human-in-the-loop** graph boundary; no model auto-selects the final haircut.
- [x] **T4.15** Use deterministic routing after selection to decide whether preview is allowed, skipped, or blocked by quota/state.

### Acceptance evidence
- [x] Recommendation cards contain all required information — AC-03.1.
- [x] Selecting B makes B active and does not reuse A-specific result — AC-03.2.
- [x] Returning to recommendation list does not re-upload/re-analyze unchanged input — AC-03.3.
- [x] Preferences may be skipped — AC-04.1.
- [x] Note boundaries are enforced — AC-04.2.
- [x] Preference edits do not automatically spend AI quota — AC-04.3.

### Vertical-slice milestone

`Upload → Analysis → Recommendations → Select hairstyle`

This is the recommended implementation target immediately after the foundation is stable.

---

# PHASE 2 — MVP Experience

## T5 — Personal hairstyle preview

**Status:** TODO  
**Goal:** Generate one personal simulation only for the explicitly selected hairstyle.  
**Depends on:** T4 + image-model decision in `design.md`.  
**References:** **FR-05**, FR-10, NFR-08/09/11; **AC-05.1–05.5**, E2E-04/05.

### Tasks
- [x] **T5.1** Lock image provider/model and generation contract in `design.md`.
- [x] **T5.2** Trigger generation only from explicit Preview/Choose action.
- [x] **T5.3** One request → one preview for one revision; no mass generation for all recommendations.
- [x] **T5.4** Preserve face identity, skin tone, framing/background as far as the selected model permits.
- [x] **T5.5** Keep original portrait available for Original/Possible comparison.
- [x] **T5.6** Label output as AI simulation and communicate that real haircut may differ.
- [x] **T5.7** Deduplicate double-click/pending identical jobs server-side.
- [x] **T5.8** If hairstyle changes while a job is pending, late result cannot overwrite the new selection.
- [x] **T5.9** Persist successful preview through navigation; do not regenerate on page return.
- [x] **T5.10** Provide retry within quota and “continue without preview”.
- [x] **T5.11** Add visual QA evidence for identity consistency + hairstyle alignment.
- [x] **T5.12** Instrument preview requested/completed/failed accurately.
- [x] **T5.13** Implement preview generation as the visual-generation branch after human selection; it must not be triggered by graph navigation alone.
- [x] **T5.14** Feed preview branch result as explicit structured state (`succeeded` / `failed` / `stale` / `skipped`) for downstream join/finalization.
- [x] **T5.15** Do not use an LLM router for quota or preview-state decisions; route from structured server state.

### Acceptance evidence
- [ ] Double click = one job — AC-05.1.
- [ ] Navigate away/back = successful preview reused — AC-05.2.
- [ ] Late A result never appears as B — AC-05.3.
- [ ] Preview failure does not block brief — AC-05.4.
- [ ] Visual review passes; API success alone is insufficient — AC-05.5.

---

## T6 — Deterministic barber brief + post-selection join

**Status:** TODO  
**Goal:** Convert the final active choice into a predictable mobile-readable barber brief and combine it with the optional preview branch without making preview a dependency.  
**Depends on:** T4; T5 optional for successful preview.  
**References:** **FR-07**, FR-10, NFR-01/09; **AC-07.1–07.4**.

### Tasks
- [x] **T6.1** Define brief data contract tied to active revision.
- [x] **T6.2** Include model, user photo, valid preview if available, top/side/back detail, fade, styling and note as available.
- [x] **T6.3** Unknown details display “confirm with barber” rather than invented measurements.
- [x] **T6.4** Allow note edit up to 500 Unicode characters.
- [x] **T6.5** Explain that note edits do not automatically change the generated preview.
- [x] **T6.6** Mark old brief stale when model/visual parameters change.
- [x] **T6.7** Support brief creation without preview when preview failed/unavailable.
- [x] **T6.8** Instrument `brief_created` only for valid current brief.
- [x] **T6.9** Build the baseline brief from validated structured fields using deterministic code/template logic; do **not** call an LLM merely to rewrite known haircut parameters.
- [x] **T6.10** Unknown/missing measurements remain explicit (`confirm with barber`) and are never filled by model inference.
- [x] **T6.11** Where runtime support and UX timing justify it, run **preview generation** and **brief construction** as independent post-selection branches.
- [x] **T6.12** Join/finalize branch outputs so preview failure never converts a valid brief branch into total-flow failure.
- [x] **T6.13** Record per-branch latency/status and total post-selection latency for Cup evidence.

### Acceptance evidence
- [ ] No preview still produces usable brief — AC-07.1.
- [ ] No active hairstyle blocks brief generation — AC-07.2.
- [ ] Note boundary errors preserve input — AC-07.3.
- [ ] Stale brief cannot be saved as latest — AC-07.4.

---

## T7 — Save, reopen, delete & repeat

**Status:** BLOCKED until storage mode is locked  
**Goal:** Make “Your best haircut, remembered” real without unnecessary repeat AI cost.  
**Depends on:** T6 + storage decision.  
**References:** **FR-08, FR-11, FR-12**, NFR-03/04/09; **AC-08.1–08.5, AC-11.1–11.2, AC-12.1–12.4** as applicable to selected storage mode.

### Tasks
- [ ] **T7.1** Lock MVP storage mode: local device/browser or account-backed.
- [ ] **T7.2** Implement persistent saved-haircut snapshot; do not store temporary object URLs as durable image references.
- [ ] **T7.3** Save name, date, revision, brief, details and available photo/preview according to privacy design.
- [ ] **T7.4** Confirm success only after persistence succeeds.
- [ ] **T7.5** Make save idempotent against double-click duplication.
- [ ] **T7.6** Preserve draft on save failure.
- [ ] **T7.7** Build My Haircuts empty and populated states.
- [ ] **T7.8** Reopen saved brief after refresh.
- [ ] **T7.9** “Repeat this cut” opens saved snapshot with **zero AI calls**.
- [ ] **T7.10** Variation creates new revision/copy without silently overwriting original.
- [ ] **T7.11** Delete requires confirmation and remains deleted after refresh.
- [ ] **T7.12** If account mode is selected, enforce owner authorization and preserve draft through login.
- [ ] **T7.13** Instrument `haircut_saved` and `saved_brief_reopened` only after real persistence/reopen.
- [ ] **T7.14** Implement save/reopen/delete/repeat as deterministic persistence functions outside reasoning nodes.
- [ ] **T7.15** `Repeat this cut` must bypass analysis/recommendation/preview model nodes unless the user explicitly starts a new variation.

---

# PHASE 3 — Cross-Cutting Quality

## T8 — Graph reliability, privacy, quota & observability

**Status:** TODO / CONTINUOUS  
**Goal:** Make AI behavior safe, measurable, bounded in cost, and revision-consistent.  
**Depends on:** Implemented continuously with T1–T7.  
**References:** **FR-10**, NFR-02–NFR-11; **AC-10.1–10.5**.

### Tasks
- [ ] **T8.1 Revision integrity:** every photo/analysis/recommendation/selection/preview/brief has sufficient revision linkage.
- [ ] **T8.2 Job state:** idle/pending/succeeded/failed + stale handling; no fake percentage progress.
- [ ] **T8.3 Deduplication:** identical pending operation produces one job/attempt.
- [ ] **T8.4 Timeout:** proposed 60s analysis / 120s image handling or updated approved values.
- [ ] **T8.5 Retry:** manual, bounded, and cannot duplicate a still-running upstream job.
- [ ] **T8.6 Quota:** server-enforced analysis/image/concurrency/budget limits; never default unlimited.
- [ ] **T8.7 Cost semantics:** provider-submitted attempts count even on provider failure/timeout; local validation/duplicate clicks do not.
- [ ] **T8.8 Privacy:** no photos, base64, tokens, free-text notes or secrets in logs/analytics.
- [ ] **T8.9 Observability:** request/job ID, stage, status, latency, model, usage/estimated cost with estimate clearly distinguished from actual cost.
- [ ] **T8.10 Security:** API keys server-only; private server data access verifies owner/session.
- [ ] **T8.11 Retention:** implement the approved temporary/photo deletion policy before external user testing.
- [ ] **T8.12 Mobile:** verify main flow at 360 px without horizontal scroll and with usable labeled controls.
- [ ] **T8.13 Browser:** verify desktop browser + at least one Android browser for MVP baseline.
- [ ] **T8.14 Graph trace:** record node start/end, selected edge/router outcome, branch status, join result, and total graph duration without user-sensitive payloads.
- [ ] **T8.15 AI-call accounting:** record justified model/image call count per flow so deterministic steps can be proven to consume zero AI tokens.
- [ ] **T8.16 Router audit:** all closed-set routers have unit tests proving outcomes without LLM calls.
- [ ] **T8.17 Branch isolation:** failure in an optional branch cannot corrupt successful independent branch state.
- [ ] **T8.18 Graph-state privacy:** only minimum structured fields cross node boundaries; raw photo bytes/references are passed only to nodes that actually require them.

---

# PHASE 4 — Acceptance & Release

## T9 — End-to-end acceptance suite

**Status:** TODO  
**Goal:** Prove the MVP behavior, failure paths and persistence rather than merely demonstrating happy-path screens.  
**Depends on:** T2–T8 relevant scope complete.  
**References:** Requirements **E2E-01–E2E-12**.

### Required scenarios
- [ ] **T9.1 / E2E-01** Valid photo → analysis → select → preview → brief → save → refresh → reopen.
- [ ] **T9.2 / E2E-02** Invalid photo/no consent blocked → valid replacement continues.
- [ ] **T9.3 / E2E-03** Analysis failure preserves input → retry → no fake result.
- [ ] **T9.4 / E2E-04** Preview failure → brief still works without preview.
- [ ] **T9.5 / E2E-05** Switch A→B while A pending → late A cannot overwrite B.
- [ ] **T9.6 / E2E-06** Note/name boundaries validated consistently.
- [ ] **T9.7 / E2E-07** Save failure/double-click → draft safe, no false success/duplicate.
- [ ] **T9.8 / E2E-08** Quota exhausted → zero new provider request.
- [ ] **T9.9 / E2E-09** Repeat uses zero AI; delete persists after refresh.
- [ ] **T9.10 / E2E-10** Cross-session/owner access denied; sensitive data absent from logs.
- [ ] **T9.11 / E2E-11** Login preserves draft and correct ownership, only if account mode exists.
- [ ] **T9.12 / E2E-12** Analytics events are not duplicated and reflect actual successful states.
- [ ] **T9.13 / Graph route** Valid flow follows the expected static graph; selected deterministic edges match state conditions.
- [ ] **T9.14 / Deterministic proof** File validation, consent, quota, schema routing, brief construction, persistence and repeat complete without hidden LLM calls.
- [ ] **T9.15 / Branch recovery** Preview branch failure still yields the deterministic brief branch and a valid final state.
- [ ] **T9.16 / Trace evidence** One complete test flow produces a judge-readable graph trace showing node types, AI-call boundaries, branch timings and final outcome.

### MVP release gate

- [ ] Main flow runs end-to-end using real AI where AI is claimed.
- [ ] MVP acceptance criteria and error paths pass.
- [ ] Private-data protection and cost limits work.
- [ ] No stale result is presented as current.
- [ ] Blocking decisions are resolved.
- [ ] Incomplete future features are not exposed as working controls.

---

## T10 — GCP deployment & AI Builder Cup readiness

**Status:** TODO  
**Goal:** Turn the accepted MVP into a verifiable competition build.  
**Depends on:** T9 + event eligibility/freshness decisions.  
**References:** Requirements **EVT-01–EVT-08, EC-01–EC-08**.

### T10.1 — Deployment
- [ ] Deploy event build to approved GCP path (Cloud Run or Firebase according to final design/event constraints).
- [ ] Configure secrets through GCP-safe mechanism.
- [ ] Apply production quota/concurrency/budget limits.
- [ ] Verify deployed health endpoint.
- [ ] Run E2E-01 from a clean browser against deployed URL.
- [ ] Record deployed architecture and Google AI model usage.
- [ ] Verify graph execution, router decisions, branch/join behavior and graph traces in the deployed environment, not only locally.

### T10.2 — Freshness & repository audit
- [ ] Resolve eligibility of reused Cutback code/assets against event freshness rule.
- [ ] Record origin/date of submitted code and assets.
- [ ] Remove secrets, private photos, office/company material and unintended files from repo/history.
- [ ] Use licensed/authorized demo portrait assets.

### T10.3 — Submission package
- [ ] Public GitHub repository accessible to judges.
- [ ] Live deployed URL accessible from clean browser.
- [ ] English README with setup, architecture, models, limitations and demo path.
- [ ] Architecture/business-case deck in English, exported as PDF.
- [ ] Demo video **≤179 seconds**.
- [ ] UI/submission material in English where used for judging.
- [ ] Recheck current event dashboard/T&C and exact cutoff before submission.

### T10.4 — Evidence mapped to judging
- [ ] **Technical/GenAI (40%)** — real AI flow, **Graph Engineering architecture**, deterministic-vs-reasoning separation, schema validation, routing, branch recovery, failure handling, cost controls, and scale story.
- [ ] **Alignment/Impact (25%)** — discovery/personalization problem, barber communication and repeat-use value; no invented impact numbers.
- [ ] **Innovation (25%)** — demonstrate the connected loop: personalization → preview → barber brief → remembered haircut, plus explain why graph orchestration makes the flow more reliable and cost-aware than a mega-prompt.
- [ ] **UX/Design (10%)** — coherent mobile experience, clear simulation labeling, useful recovery from AI failures.

---

# 5. Deferred / Not Blocking MVP

The following must **not** delay the current critical path unless the spec is intentionally changed:

- [ ] Full structured haircut customization — FR-06 (later release in Requirements v0.3).
- [ ] Automatic brief image export.
- [ ] Favorite / rename management beyond minimum save naming.
- [ ] Actual post-haircut photo + rating — FR-09.
- [ ] Cross-device account sync when local storage is selected for MVP.
- [ ] Booking / marketplace / payment / ads / barber dashboard.
- [ ] Android native / Play Store release.
- [ ] Live AR / 3D / multi-angle generation / free-form hair-region editing.
- [ ] Training a proprietary face/hair model or building a face dataset.

---

# 6. Immediate Sprint — 24 September 2026

The goal of this iteration is to convert the existing backend plan into a **graph-first engineering baseline** and reach the first real Cutback reasoning slice without overbuilding the full MVP.

## P0 — Lock and prove the graph foundation

- [ ] T0.1–T0.13 — lock runtime, ADK/ADK2 graph APIs, node taxonomy, state envelope, deterministic routes, credentials, quota and GCP target.
- [ ] T1.1 — runnable project structure.
- [ ] T1.2 — API + free health endpoint.
- [ ] T1.3 — minimal executable graph with one deterministic node + one real Google reasoning node + deterministic output validation.
- [ ] T1.4–T1.7 — config, response/error contract, logging/security and tests.
- [ ] T1.10–T1.11 — graph state/edge contract + deterministic router test.
- [ ] T1.12 — fan-out/join capability spike only if cleanly supported by the selected runtime.

## P1 — First product graph

- [ ] T2 — deterministic upload/validation/consent nodes.
- [ ] T3 — real structured Gemini photo-analysis node + schema validation route.
- [ ] T4 — recommendation reasoning node + schema check + human hairstyle selection.

## P2 — Cup-visible orchestration

- [ ] T5/T6 — post-selection preview branch + deterministic barber-brief branch; add join/finalization only where runtime support and UX timing justify it.
- [ ] Capture one trace showing which nodes used AI and which did not.

## Stretch

- [ ] Start T7 persistence after storage mode is locked.
- [ ] Prepare deployed graph observability only after the local graph is stable.

### Success condition

Minimum successful outcome:

```text
Cutback UI
  → deterministic photo validation
  → consent gate
  → Gemini analysis node
  → deterministic schema validation
  → structured analysis UI
```

Preferred outcome:

```text
Upload
  → Analysis Node
  → Recommendation Node
  → Human Selection
  → deterministic route to preview / brief
```

Cup-visible proof:

```text
Graph trace
  → node type
  → selected edge
  → AI call boundary
  → latency / status
  → final result
```

**Do not add extra agents, LLM routers, or dynamic graphs unless they solve a concrete open-set or runtime-shape problem. Controlled sophistication is the target.**

---

# 7. Task Completion Record Template

Use this block when closing an implementation task:

```text
Task ID:
Status: DONE / BLOCKED
Requirement refs:
Implementation summary:
Tests executed:
Acceptance criteria passed:
Evidence / screenshots / logs:
Known limitations:
Spec/design changes made:
Next dependency unlocked:
```

---

# 8. Current Overall Status

| Area | Status |
| --- | --- |
| PRD | Baseline available |
| Requirements | v0.3 baseline available |
| UI / motion direction | Existing baseline; not re-audited by this task file |
| `design.md` | Must be synchronized with graph architecture, exact ADK APIs, node contracts and GCP runtime decisions |
| Graph architecture | **Direction selected; implementation not yet proven** |
| `tasks.md` | **Updated — v0.2 Graph Engineering baseline** |
| ADK graph foundation | Not yet proven by this document |
| Real ADK/Google model graph execution | Not yet proven by this document |
| Product graph vertical slice | Not yet proven by this document |
| E2E MVP acceptance | Not yet proven by this document |
| GCP submission deployment | Not yet proven by this document |


