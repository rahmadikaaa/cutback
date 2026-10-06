# Cutback V2 — v0.7 Implementation Plan

This plan addresses the three confirmed research-alignment gaps specified in requirements v0.7.

## 1. Evidence Provenance
**Goal:** Distinguish analysis attributes by source: `Observed`, `Inferred`, `User-provided`, and `Unknown`.

1. **Current implementation:** `backend/src/analysis.ts` returns flat string enums for hair attributes, defaulting to 'unknown' if uncertain. `frontend/src/App.tsx` renders these flat values.
2. **Exact files/modules affected:** 
   - `backend/src/analysis.ts` (Schema and Genkit prompt)
   - `frontend/src/App.tsx` (Analysis UI)
   - `backend/src/state.ts` (State typing)
3. **Schema/type changes:**
   - Update `AnalysisSchema` in `analysis.ts` to wrap attributes in a provenanced structure, e.g., `{ value: string, source: 'Observed' | 'Inferred' | 'User-provided' | 'Unknown' }`.
4. **Logic changes:**
   - Update the Gemini prompt in `analysis.ts` to classify the source of its conclusions. Instruct the model that provenance must come from the actual evidence source: `Observed` (directly visible/detectable), `Inferred` (AI conclusion derived from evidence), `User-provided` (explicitly provided by user/input), or `Unknown` (cannot be reliably determined). Explicitly forbid arbitrarily labeling a visual observation as "User-provided".
   - Update `App.tsx` to render visual indicators (e.g., badges) based on the `source` field.
5. **API/contract changes:** The response payload from `/api/analyze` will nest attribute values under the provenance object.
6. **Tests required:** Unit tests verifying schema validation rejects invalid provenance enums. Use deterministic fixtures/controlled inputs for automated tests (fixture/input → analysis → schema → assert provenance) rather than depending on random/live AI responses. Live AI testing may remain as supplementary validation.
7. **Backward-compatibility considerations:** Existing `ANALYZED` states in IndexedDB/Firestore missing the `source` field will need a migration or fallback in the frontend parser to default to `'Unknown'`.
8. **Requirements satisfied:** AC-02.6, FR-02.

## 2. Recommendation Feasibility & Transition Reasoning
**Goal:** Support feasibility classification (`Ready Now`, `Possible with Adjustment`, `Transition Required`, `Not Currently Realistic`) and textual transition reasoning.

1. **Current implementation:** `backend/src/recommendation.ts` generates recommendations with a generic `constraints` array and `stylingEffort`.
2. **Exact files/modules affected:**
   - `backend/src/recommendation.ts` (Schema and Genkit prompt)
   - `frontend/src/App.tsx` (Recommendation Card UI)
3. **Schema/type changes:**
   - Add `feasibility: z.enum(['Ready Now', 'Possible with Adjustment', 'Transition Required', 'Not Currently Realistic'])` to `RecommendationSchema`.
   - Add `transitionGuidance: z.string().optional()` to `RecommendationSchema`.
4. **Logic changes:**
   - Modify the Gemini prompt in `recommendation.ts` to strictly evaluate feasibility and provide `transitionGuidance` when returning "Transition Required" or "Not Currently Realistic".
   - Update `App.tsx` to display the feasibility status clearly on recommendation cards, rendering `transitionGuidance` conditionally.
5. **API/contract changes:** Extra fields in the `/api/recommend` response array elements.
6. **Tests required:** Verify schema enforces the new enum and that transition guidance is present when feasibility implies a gap.
7. **Backward-compatibility considerations:** Preserve legacy recommendation data and handle missing feasibility gracefully. Do NOT default missing legacy feasibility to `'Possible with Adjustment'` as that creates an unsupported claim. Do not display a fabricated feasibility state. Define migration only if actually required by the existing data flow.
8. **Requirements satisfied:** AC-03.1, FR-03.

## 3. Structured Barber Brief
**Goal:** Replace unstructured descriptions with distinct categories (Top, Sides, Back, Fringe, Styling, Maintenance, Preserve, Avoid, Confirm with barber).

1. **Current implementation:** The brief relies on unstructured strings (or frontend string-interpolation of the recommendation `description`/`reason`).
2. **Exact files/modules affected:**
   - `backend/src/recommendation.ts` (to source the structured brief payload during recommendation).
   - `frontend/src/App.tsx` (Barber Brief rendering logic).
3. **Schema/type changes:**
   - Add a `barberBrief` object to `RecommendationSchema` in `recommendation.ts`, containing `top`, `sides`, `back`, `fringe`, `styling`, `maintenance`, `preserve`, and `avoid` as `z.string().optional()`.
4. **Logic changes:**
   - Update the Gemini prompt to formulate instructions matching these structural categories.
   - Force the model to output "Confirm with barber" for unobservable guard numbers or exact lengths.
   - Update the UI in `App.tsx` to render a grouped list instead of a single block of text.
5. **API/contract changes:** Payload from `/api/recommend` will now contain the structured brief nested inside the recommendation object.
6. **Tests required:** E2E/Unit test confirming no hallucinated measurements appear in the generated output (model instruction check).
7. **Backward-compatibility considerations:** Frontend must fallback to rendering legacy `description`/`constraints` if `barberBrief` is `undefined`.
8. **Requirements satisfied:** AC-07.1, FR-07.

## Implementation Order & Dependencies
1. **Phase 1: API Contracts & Prompts** (Backend)
   - Update `AnalysisSchema` and `RecommendationSchema` in `analysis.ts` and `recommendation.ts`.
   - Adjust Gemini prompts to satisfy the new constraints.
2. **Phase 2: UI Integration** (Frontend)
   - Update `App.tsx` to parse and render evidence provenance badges.
   - Render feasibility indicators and transition notes on recommendation cards.
   - Build the structured Barber Brief UI layout.
3. **Phase 3: Testing & E2E Validation** (Full Stack)

## E2E Validation Plan
- **Analysis:** Upload test portrait. Verify response payload includes `source: 'Observed'` for visible hair and `source: 'Unknown'` for hidden attributes.
- **Evidence Provenance:** Verify frontend correctly displays badges differentiating observed facts vs. unknowns.
- **Recommendation:** Trigger recommendations. 
- **Feasibility:** Use controlled recommendation fixtures or deterministic test inputs to verify the feasibility enum, `transitionGuidance`, and UI rendering. Do NOT use prompt manipulation to force states. Live AI validation can be supplementary.
- **Transition Reasoning:** Confirm the fixture for a "Transition Required" style renders an explanation for the gap.
- **Preview:** Generate a preview; verify existing visual continuity logic still works unhindered by schema changes.
- **Barber Brief:** View the final brief. Confirm text is divided into Top/Sides/Back/etc., and that no fabricated mm/inches are shown, observing "Confirm with barber" instead.
- **Final Output:** End-to-end trace completes, storing the new structured data correctly.
