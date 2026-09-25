# Cutback baseline update — 19 September 2026

## Active documents

- `cutback-prd.md` — version 0.2
- `cutback-requirements.md` — version 0.4

Historical inputs are retained under `history/` and are not active baselines.

## Main changes

1. Locked the product platform direction as a **mobile-first web app**, with smartphone as primary and desktop supported.
2. Kept native Android/Play Store as a later milestone.
3. Preserved the canonical core flow: upload → validation → analysis → recommendations → selected model → preview → barber brief → save/reopen.
4. Kept preferences optional and prevented automatic preview generation for every recommendation.
5. Added mobile acceptance behavior for 360 px width, 44×44 CSS px touch target, gallery/camera/fallback upload, virtual keyboard, photo/preview inspection, reconnect/retry, draft continuity, image-quality preservation, and real Chrome Android/Safari iOS verification.
6. Added BF-01–BF-09 to the active requirements and clarified that backend foundation is the current milestone while functional MVP is the subsequent milestone.
7. Retained Google ADK as runtime direction and agent-skills as coding guidance; framework/API/schema/storage remain design decisions.
8. Refreshed AI Builder Cup event notes from accessible official sources and clearly separated verified rules, internal Cutback decisions, and unresolved items.
9. Current event working rule: team 2–4 and team formation through 11 Oct 2026 according to the current indexed overview, but an older official cached page still says 1–4; final roster must recheck dashboard/latest T&C.
10. Public-repo and old-code/assets freshness claims from the prior baseline could not be fully reverified from accessible official sources, so they remain explicit needs-verification gates instead of being asserted as facts.

## Decisions to resolve in design.md

- frontend/backend framework and repository topology;
- Google ADK/model versions and structured schemas;
- image-generation model and identity-preservation approach;
- upload normalization/compression thresholds and quality validation;
- API/job/retry/reconnect contract;
- local vs account persistence, authentication, ownership, database/object storage;
- retention/backup/deletion behavior;
- quotas, concurrency, budget, and validated timeouts;
- first-MVP customization boundary;
- exact GCP deployment service/topology;
- event unresolved items: final team-size source, repo requirement, T&C/freshness of old code/assets, exact cutoff time, and final submission-form fields.
