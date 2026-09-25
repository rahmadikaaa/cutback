# Cutback --- Design Specification

**Version:** 1.1\
**Date:** 20 September 2026\
**Status:** Design Direction Locked --- Execution May Iterate\
**Product:** Cutback\
**Platform:** Mobile-first web app; smartphone is the primary
experience, desktop remains supported\
**Source of truth:** `cutback-prd(2).md` + `cutback-requirementsV0.md`
v0.3\
**Visual direction reference:** final selected Dark / Navy Cutback
mobile concept supplied by the product owner\
**Motion / interaction reference:** uploaded 3D fashion transformation video; used as interaction grammar reference, not as a literal 3D implementation target

------------------------------------------------------------------------

## 1. Purpose of This Document

This document translates Cutback's product requirements into a coherent
product experience and implementation direction.

It does **not** replace the PRD or requirements. The hierarchy is:

> **PRD → Requirements → Design → Tasks → Code → Tests → Evidence**

The requirements define **what must work**. This document defines **how
those requirements should become one recognizable Cutback experience**.

This design is intentionally product-first. AI models, rendering
techniques, graph representations, image-editing methods, and
implementation libraries may change if testing finds a better approach.
The experience invariants in this document should not change without an
explicit design decision.

### Design lock principle

> **Lock the direction. Iterate the execution.**

------------------------------------------------------------------------

# 2. Design Thesis

## 2.1 Cutback is a Transformation Journey

Cutback is not a collection of AI features and it is not primarily a
hairstyle generator.

> **Cutback is a personal Transformation Journey.**

The user starts with reality, develops an understanding of what is
possible, makes a decision, turns that decision into something
actionable, and ultimately carries it into the real world.

The complete conceptual journey is:

> **REALITY → UNDERSTAND → INTENT → GROUNDED ADVICE → EXPLORE → DECIDE →
> IMAGINE → DEFINE → ACT → REALITY → REMEMBER**

The software MVP covers the journey through Barber Brief and
memory/repeat. Physical execution by a barber is the real-world
continuation of the journey and an important validation path, but is not
silently promoted into a mandatory software feature unless the
requirements are updated.

## 2.2 The user is the main character

The interface is not the hero. AI is not the hero.

> **The user is the main character.**

AI enables understanding and possibility.\
Cutback orchestrates the transformation.\
The user makes the decision.\
The barber can make it real.\
Cutback remembers what worked.

The design should therefore keep the user's own image, intent, decision,
and outcome visually and conceptually central.

## 2.3 Grounded Transformation

Cutback must not begin from fantasy generation.

It begins from reality:

> **Observable reality + user intent → grounded recommendation →
> personalized possibility → actionable haircut**

AI recommendations should visibly connect back to information the system
actually has. Attributes that cannot be observed should remain unknown
rather than being invented.

The desired reaction is not:

> "AI generated a cool hairstyle."

It is:

> **"I understand why this could work for me."**

------------------------------------------------------------------------

# 3. Product Identity

## 3.1 Product promise

> **Your best haircut, remembered.**

This is the long-term product promise. Cutback is valuable not only when
a haircut is discovered, but when a successful decision can later be
reopened and repeated.

## 3.2 Consumer expression

> **Bikin rambut impian lo jadi nyata.**

English equivalent for event/public material:

> **Turn the haircut you imagine into one you can actually get.**

## 3.3 Competition / technology narrative

> **AI. But it's real.**

This is a narrative device, not a claim that an AI preview is guaranteed
to match a physical haircut. It means Cutback is designed to move AI
output toward a real-world action rather than stopping at image
generation.

## 3.4 Core interaction statement

> **Same you. Different possibilities.**

The user's identity is the anchor. Hair is the primary variable.

## 3.5 Internal design mantra

> **Don't design screens. Design the transformation.**\
> **Don't animate decoration. Animate understanding.**

------------------------------------------------------------------------

# 4. Locked Design Invariants

The following principles are locked for Design v1.

### D-INV-01 --- User as visual anchor

The user's own photo should remain the primary visual anchor wherever
the journey benefits from continuity.

### D-INV-02 --- Grounded in You

Recommendations must be grounded in observable characteristics, user
corrections, and user intent/preferences. The interface should make this
relationship understandable.

### D-INV-03 --- Identity is the anchor; hair is the variable

During hairstyle exploration, face/identity, pose, framing, and non-hair
context should remain visually stable wherever technically feasible.
Hair is the primary changing visual property.

### D-INV-04 --- Human decision remains explicit

AI may recommend and explain. The user chooses the haircut. A "Best
Match" is guidance, not an automatic final decision.

### D-INV-05 --- Possibility is not a promise

AI previews are simulations. UI copy and comparison treatment must not
imply guaranteed physical results.

### D-INV-06 --- Every AI output moves toward action

Analysis should support recommendation. Recommendation should support
choice. Preview should support confidence. Haircut definition should
support the Barber Brief. The Brief should support real-world
communication.

### D-INV-07 --- Transformation, not page hopping

Transitions should preserve continuity between states. The experience
should feel like the current state evolves into the next one rather than
a sequence of unrelated pages.

### D-INV-08 --- Remember what worked

The journey does not end at generation. Saved Haircuts and Repeat are
part of the product identity.

### D-INV-09 --- Sophisticated experience, simple machinery

Do not introduce technical complexity merely to make the architecture
sound advanced. Use the minimum complexity required to create the
intended experience reliably.

### D-INV-10 --- Mobile is primary

The full primary flow must remain usable from 360 px width without
horizontal scrolling. Desktop adapts the experience; it does not define
it.

------------------------------------------------------------------------

# 5. Visual Direction --- Dark / Navy

The selected visual direction is the **Dark / Navy Cutback mobile
experience**.

The reference establishes the visual character, not literal
pixel-perfect implementation.

## 5.1 Brand character

Cutback should feel:

-   masculine without becoming aggressive;
-   editorial rather than dashboard-like;
-   premium but approachable;
-   modern with restrained classic barbershop cues;
-   confident rather than loud;
-   image-led rather than UI-chrome-led.

The chosen reference uses a dark navy/near-black environment, warm
restrained accent tones, editorial serif typography, large portrait
photography, fine dividers, and minimal controls.

## 5.2 Visual hierarchy

The hierarchy should generally be:

1.  **User / haircut imagery**
2.  **Transformation message or current decision**
3.  **Grounded explanation**
4.  **Primary action**
5.  Secondary navigation and metadata

The interface should never compete visually with the person's face and
hair.

## 5.3 Color direction

Use semantic design tokens rather than hard-coded colors in feature
components.

Suggested token roles:

-   `surface.base` --- near-black / dark navy
-   `surface.raised` --- slightly lighter navy
-   `surface.soft` --- muted dark panel
-   `text.primary` --- warm off-white
-   `text.secondary` --- muted warm gray
-   `accent.primary` --- restrained warm sand/gold
-   `accent.onPrimary` --- dark navy/black
-   `border.subtle` --- low-contrast warm/neutral line
-   `state.error`, `state.success`, `state.warning` --- accessible
    semantic colors selected during implementation

Exact values are implementation decisions and must pass contrast
testing.

## 5.4 Typography

Use an editorial display face for brand/hero moments and a highly
legible sans-serif for functional UI.

Typography must preserve the premium editorial character without
sacrificing readability on 360 px screens.

Do not use tiny uppercase tracking for essential information. Decorative
microcopy may use editorial treatments only when it remains readable.

## 5.5 Imagery

Portraits should feel real, intimate, and haircut-focused.

For the product itself: - user-uploaded imagery is primary; - AI preview
must be explicitly distinguishable from original imagery; - reference
hairstyle imagery, if used, must be labeled as reference; - demo/public
imagery must have appropriate rights/permission.

------------------------------------------------------------------------

# 6. Experience Architecture

## 6.1 Functional requirement flow

The baseline functional flow remains:

> **Upload → Validation/Consent → Analysis → Recommendations → Choose →
> Preview → Barber Brief → Save/Reopen → Repeat**

Preferences are optional and may refine recommendations after initial
analysis.

Only the selected haircut receives the expensive/high-quality
personalized preview in the baseline requirement.

## 6.2 Experiential flow

The same functional flow is experienced as:

  ------------------------------------------------------------------------
  Functional state        Human state              Design meaning
  ----------------------- ------------------------ -----------------------
  Upload                  Reality                  "This is me."

  Analysis                Understood               "Cutback understands
                                                   what it can actually
                                                   see."

  Preferences             Intent                   "This is how I want to
                                                   look/live with the
                                                   haircut."

  Recommendation          Grounded possibilities   "These options make
                                                   sense for me, and I
                                                   know why."

  Exploration             Curiosity                "Same me. Different
                                                   possibilities."

  Selection               Decision                 "This one."

  Preview                 Imagination/confidence   "This could be me."

  Definition              Clarity                  "This is what makes the
                                                   haircut work."

  Barber Brief            Action                   "This is something I
                                                   can take to my barber."

  Save                    Memory                   "Remember this."

  Repeat                  Confidence               "I can get this again."
  ------------------------------------------------------------------------

------------------------------------------------------------------------

# 7. The Transformation Journey

## 7.1 Stage 1 --- REALITY / "This is me"

### Goal

Establish the user's real starting point.

### Experience

The flow begins with the user's selfie/photo, not a long preference
questionnaire.

The upload experience should feel like the start of a transformation
rather than a file-picker utility.

### Required behavior

-   photo guidance;
-   local preview;
-   replace photo;
-   explicit processing consent;
-   invalid visual input recovery;
-   clear privacy language.

### Design rule

Once a valid photo is selected, preserve it as the visual anchor for
subsequent states whenever appropriate.

**Requirement trace:** FR-01, NFR-01, NFR-03.

------------------------------------------------------------------------

## 7.2 Stage 2 --- UNDERSTAND / "Grounded in You"

### Goal

Turn the selfie into structured, bounded understanding.

### Experience

Do not hide analysis behind a generic spinner and then dump a report.

The user's image remains visible while analysis findings are
progressively presented around or alongside the relevant context.

Examples of presentation categories: - observable face
characteristics; - visible hair pattern/texture; - visible current
length/volume; - relevant constraints; - explicitly unknown/uncertain
attributes.

### Critical rule

Cutback must distinguish: - **Observed** - **User-corrected** -
**Unknown** - later, **Derived recommendation**

The UI must not imply that uncertain attributes were confidently
detected.

### Motion principle

Animate understanding, not fake AI scanning.

If progressive labels appear, they represent real returned analysis
states/data, not fabricated diagnostic precision.

### User control

The user can correct hair observations before refreshing
recommendations.

**Requirement trace:** FR-02, FR-10, NFR-06.

------------------------------------------------------------------------

## 7.3 Stage 3 --- INTENT / "Where do you want to go?"

### Goal

Combine reality with desire.

### Experience

Preferences are lightweight and optional. They should feel like
direction-setting, not form completion.

Primary concepts: - vibe; - desired length; - styling effort; - free
notes.

A future design iteration may refine the vocabulary, but the experience
should ask human questions such as:

> **How do you want to look?**

rather than requiring haircut expertise.

### Visual model

> **WHO YOU ARE NOW**\
> observed/corrected reality
>
> **+**
>
> **WHERE YOU WANT TO GO**\
> user intent
>
> **=**
>
> **GROUNDED POSSIBILITIES**

**Requirement trace:** FR-04.

------------------------------------------------------------------------

## 7.4 Stage 4 --- GROUNDED ADVICE / "Why this works for you"

### Goal

Generate understandable recommendations rather than arbitrary hairstyle
suggestions.

### Experience

The system may return up to three distinct recommendations when
supported by the input.

Each recommendation must expose: - haircut name; - short description; -
why it is recommended; - styling effort; - constraints/trade-offs; -
Best Match label only with explanation.

### Design change from old card-first thinking

Recommendations may still use cards for accessibility and overview, but
the primary experience should not end at a grid/list of cards.

Recommendations feed the Transformation Canvas.

### Reasoning presentation

The user should be able to understand the recommendation as a connection
between:

> **Observed reality + user intent → recommendation**

Avoid unsupported percentages such as "94% compatible".

Prefer evidence-oriented language: - "works with your visible natural
volume"; - "supports the cleaner/fresher direction you selected"; -
"requires more styling than your low-effort preference"; - "you may need
additional length before this cut is practical".

**Requirement trace:** FR-03, FR-04.

------------------------------------------------------------------------

# 8. Transformation Canvas

## 8.1 Definition

The Transformation Canvas is the core visual experience of Cutback.

> **The user remains the canvas. Hair becomes the primary changing
> variable.**

It translates recommendations from abstract options into personal
possibilities.

## 8.2 Design objective

The Transformation Canvas is now the **signature interaction layer** of Cutback. Its interaction grammar is inspired by the uploaded fashion-transformation reference: **stable subject → controlled changing attribute → meaningful transition**. Cutback adapts that grammar into **stable identity → changing hairstyle → changing grounded reasoning**.

This is not a requirement to reproduce the reference website, use 3D, WebGL, a rotating head, or any particular animation stack. We adopt the perceptual pattern, not the implementation complexity.

During exploration:

-   identity remains visually stable;
-   face remains visually stable;
-   pose/framing remains stable where feasible;
-   clothing/background should not become the focus of change;
-   hairstyle is the primary visual variable;
-   recommendation explanation updates with the selected possibility.

The desired feeling:

> **Same you. Different possibilities.**

## 8.3 Exploration interaction

Candidate interaction pattern:

-   swipe horizontally or use explicit previous/next controls;
-   haircut name and rationale update with the current possibility;
-   clear active position, e.g. `1 / 3`;
-   explicit **Choose This Cut** action;
-   recommendation can be explored without committing;
-   selection remains reversible.

Do not make essential navigation gesture-only.

## 8.4 Hold to Compare

Candidate signature interaction:

> **Hold → Me Now**\
> **Release → Possible Me**

Alternative accessible control: - explicit `Original / Possible`
toggle; - before/after slider if it remains usable at 360 px.

The comparison must never obscure which image is original and which is
simulated.

## 8.5 Technical hypothesis, not technical lock

The experience is locked. The rendering method is not.

Possible implementation approaches to evaluate: - lightweight
hair-region representation; - segmentation/masking; - cached image
edits; - precomputed variants; - graph/structured hair representation; -
hybrid approach.

**Graphify is a hypothesis, not a mandatory technology.**

The design requirement is:

> **Preserve the user's visual identity while making hairstyle the
> primary variable, without requiring uncontrolled expensive generation
> on every browsing action.**

The baseline requirement still permits the safe fallback:

> recommendation exploration → select one → generate one high-quality
> personalized preview.

------------------------------------------------------------------------

# 9. DECIDE / "This one."

Selection is a meaningful transformation state, not just a radio button.

When the user chooses a haircut: - the selected option becomes the
active revision; - alternatives visually recede; - the primary CTA moves
toward personalized preview; - old results belonging to another
selection must not appear as current; - the user can return and choose
another option without re-uploading.

The design should make ownership explicit:

> **You chose this.**

This reinforces that AI advises; the user decides.

**Requirement trace:** FR-03, FR-10 revision/stale-result rules.

------------------------------------------------------------------------

# 10. IMAGINE / Final Personalized Preview

## 10.1 Purpose

This is the hero transformation moment.

The selected haircut becomes a high-quality personalized simulation on
the user's photo.

> **CURRENT ME → POSSIBLE ME**

## 10.2 Visual treatment

Prefer an immersive portrait treatment rather than a small result card.

Provide: - original vs AI simulation; - clear labels; - easy
comparison; - haircut name; - concise grounded rationale; - visible
simulation disclaimer.

Suggested copy:

> **Possible You**

not:

> "This is exactly how you will look."

## 10.3 Generation policy

The high-quality preview is generated only after explicit user action
for the selected haircut.

Do not automatically generate all recommendation previews.

A successful preview should be cached/persisted for the active revision
and must not regenerate merely because the user navigates away and
returns.

## 10.4 Failure

If image generation fails: - preserve recommendation and selection; -
explain the failure; - allow retry within quota; - allow the user to
continue toward a text/structured Barber Brief.

The Transformation Journey must degrade gracefully instead of collapsing
because image generation failed.

**Requirement trace:** FR-05, FR-10, NFR-05, NFR-08.

------------------------------------------------------------------------

# 11. DEFINE / Haircut Representation

## 11.1 Purpose

A generated image alone is not the product outcome.

Cutback must translate the chosen haircut into understandable structure.

Conceptual representation:

``` text
HaircutSpec
├── style
├── top
│   ├── length/category
│   ├── texture
│   └── direction
├── sides
│   ├── technique
│   └── transition
├── back
├── fade/taper
├── fringe
├── styling
├── constraints
└── unknowns / confirm-with-barber
```

This is a conceptual design model. Exact schema belongs in technical
design and must align with requirements before implementation.

## 11.2 Source-of-truth rule

Do not treat the generated preview image as a measurement oracle.

The structured haircut definition should be derived from the selected
recommendation, explicit user choices, corrections, and supported
parameters.

The image visualizes the choice. It does not invent precise measurements
that the system does not know.

## 11.3 Visual anatomy

The selected preview may expose lightweight callouts such as:

-   **TOP --- textured**
-   **SIDES --- low taper**
-   **TRANSITION --- gradual**
-   **DIRECTION --- forward**
-   **STYLING --- low effort**

Only show claims supported by the structured state.

This is where a future Graphify-style visualization can add value.

------------------------------------------------------------------------

# 12. Barber Brief --- From Possibility to Action

## 12.1 Purpose

The Barber Brief is the reality bridge.

> **Possibility → Definition → Action**

The goal is not to tell a professional barber how to do their job. The
goal is to reduce ambiguity between what the customer wants and what the
barber understands.

## 12.2 Content hierarchy

1.  selected haircut;
2.  user's original/reference photo;
3.  AI preview if available, clearly labeled;
4.  top;
5.  sides;
6.  back;
7.  fade/taper;
8.  styling direction;
9.  user notes;
10. unknowns as **Confirm with barber**.

## 12.3 Visual direction

The selected Dark/Navy reference is particularly strong here.

The Brief should feel like a clean professional handoff: - large enough
to show on a phone; - readable under barbershop lighting; - minimal
decorative content; - structured scanning; - icons only when they
improve comprehension; - no tiny critical text.

## 12.4 Real-world handoff

Primary action:

> **Show My Barber**

If export/share is implemented according to scope, it remains
user-initiated and does not make private imagery public.

**Requirement trace:** FR-07.

------------------------------------------------------------------------

# 13. REMEMBER / Saved Haircuts

## 13.1 Purpose

This stage converts a one-time AI experience into a repeatable product.

> **Remember what worked.**

A Saved Haircut is not merely a bookmarked image. It preserves the
decision state needed to understand and repeat the haircut.

## 13.2 Saved object

Depending on active scope, save: - haircut name; - selected
recommendation; - final parameters; - Barber Brief; - available
preview; - date; - revision metadata required for consistency.

## 13.3 Repeat experience

The primary repeat path should not require new AI calls:

> **My Haircuts → select saved haircut → open existing brief → Repeat
> This Cut**

If the user chooses to modify the haircut, create a new revision/version
rather than silently overwriting the successful previous state.

**Requirement trace:** FR-08, FR-11.

------------------------------------------------------------------------

# 14. REALITY LOOP --- Post-MVP / Validation Direction

The full product vision continues beyond the current core MVP:

> **Barber Brief → real haircut → actual result → feedback → memory**

Actual-result capture remains a later feature unless promoted through a
requirements change.

Potential future loop: - upload actual post-cut photo; - rate result; -
record notes such as "sides slightly too short"; - associate the result
with the Brief used; - use the real outcome as a stronger memory for
repeat.

This future loop supports the product thesis:

> AI helps imagine. Reality validates. Cutback remembers.

------------------------------------------------------------------------

# 15. Motion & Transition System

## 15.1 Motion philosophy

> **Everything transforms. Nothing appears without meaning.**

The motion language adopts the strongest transferable idea from the uploaded reference: keep the hero subject perceptually stable while the meaningful product attribute changes. In Cutback, the hero subject is the user and the controlled variable is primarily hair.

> **Stable Subject → Controlled Variable → Meaningful Transformation**
>
> becomes
>
> **Stable Identity → Hair Changes → Reasoning Changes → User Chooses → Reality**

Motion is used to communicate: - understanding; - narrowing
possibilities; - selection; - comparison; - conversion from visual
possibility into structured instruction; - persistence into memory.

Avoid animation whose only purpose is spectacle.

### Motion complexity boundary

The design does **not** require Three.js, WebGL, 3D head reconstruction, rotating avatars, particle systems, or cinematic camera movement. Use them only if a later experiment proves they materially improve the experience without compromising mobile performance, accessibility, delivery risk, or clarity.

The target is **cinematic perception with restrained implementation**: image continuity, controlled transitions, crop/scale, opacity, masks where appropriate, and state-driven motion are preferred before introducing a heavy 3D runtime.

## 15.2 Transformation continuity

Preferred motion relationships:

-   selfie → analysis annotations;
-   observations + intent → recommendation;
-   recommendation → Transformation Canvas;
-   hairstyle A → hairstyle B while identity remains anchored;
-   selected possibility → final preview;
-   preview callouts → Barber Brief sections;
-   Brief → saved haircut card.

## 15.3 Honest loading

Do not fake precise AI progress.

Use truthful phase-level states when the backend can support them, for
example: - Preparing photo - Analyzing visible features - Building
recommendations - Creating selected preview

If only a single unknown-duration job state exists, use an indeterminate
treatment rather than fabricated percentages.

## 15.4 Reduced motion

Respect `prefers-reduced-motion`.

With reduced motion: - replace morphs with short fades/state changes; -
preserve all information; - no interaction may require animation to be
understood.

## 15.5 Performance

Motion must not compromise the primary smartphone experience.

Prefer GPU-friendly transforms/opacity and avoid unnecessary heavy
effects. The Transformation Canvas must remain responsive on realistic
mid-range mobile hardware.

------------------------------------------------------------------------

# 16. Mobile-First Interaction Rules

The product is designed first for smartphone use.

## 16.1 Baseline

-   primary flow works from 360 px;
-   no horizontal page overflow;
-   safe-area aware;
-   essential CTA remains reachable;
-   no hover-only interaction;
-   keyboard-operable controls where applicable;
-   focus states visible.

## 16.2 Touch

Interactive controls should use comfortable touch targets. Exact token
value should be finalized in the design system and tested on device.

## 16.3 One-handed use

Primary actions should generally be positioned within practical reach on
mobile when doing so does not conflict with content hierarchy.

## 16.4 Portrait-first imagery

Transformation Canvas and Preview prioritize portrait orientation.
Desktop may expand the composition but should not alter the journey.

------------------------------------------------------------------------

# 17. Navigation & Information Architecture

Avoid a dashboard-first product.

Recommended primary architecture:

``` text
Home
├── Start Transformation
│   ├── Upload
│   ├── Understand
│   ├── Intent
│   ├── Recommendations
│   ├── Transformation Canvas
│   ├── Selected Preview
│   ├── Define
│   └── Barber Brief
└── My Haircuts
    ├── Saved Haircut
    └── Repeat / Create Variation
```

Persistent bottom navigation should be used only if it improves real
repeat usage. It must not visually compete with the transformation flow.

During a focused transformation, contextual back navigation and
progress/state cues may be more appropriate than exposing the entire app
hierarchy.

------------------------------------------------------------------------

# 18. Home / Landing Direction

The selected visual reference provides the brand direction but the
landing page must communicate the real product promise.

The hero should emphasize transformation rather than generic grooming
aspiration.

Recommended content hierarchy:

**CUTBACK**

> **A sharper you.**

or another tested brand headline,

followed by a clearer product promise:

> **Find a haircut grounded in your features, preview it on yourself,
> and take a clear brief to your barber.**

Primary CTA:

> **Find My Haircut**

Secondary path:

> **My Haircuts / Repeat My Best Cut**

The hero portrait should support the identity but must not imply that
the stock/model image is the user's generated result.

------------------------------------------------------------------------

# 19. Data-Driven Transformation System

The interface should reflect the state of the underlying journey.

## 19.1 Data categories

### Reality

-   uploaded photo;
-   consent;
-   observable analysis.

### Corrections

-   user corrections to observed hair characteristics.

### Intent

-   vibe;
-   desired length;
-   styling effort;
-   notes.

### Derived

-   recommendations;
-   rationale;
-   constraints.

### Decision

-   selected haircut;
-   active revision.

### Visualization

-   selected preview;
-   preview status.

### Definition

-   structured haircut parameters/spec.

### Action

-   Barber Brief.

### Memory

-   saved haircut;
-   repeat state.

## 19.2 Design rule

> **Data changes should produce understandable visual state changes.**

The UI must not show stale preview/brief output as current when the
underlying decision changed.

This is both a backend integrity rule and a design requirement.

------------------------------------------------------------------------

# 20. State, Revision & Consistency Design

Every meaningful change that affects recommendation/preview/brief must
have a clear state consequence.

Examples: - new photo → previous analysis/recommendations no longer
current; - corrected analysis → recommendation requires refresh; -
changed preference → existing recommendation is old until explicitly
refreshed; - selected haircut A → preview A must not appear as preview
B; - parameter changes → preview/brief may become stale; - late job
result from an old revision → must not replace the active revision.

The UI should use clear language such as: - **Needs update** - **Based
on previous choice** - **Preview not updated yet**

rather than silently showing inconsistent artifacts.

**Requirement trace:** FR-10 cross-feature rules, NFR-06.

------------------------------------------------------------------------

# 21. Error & Recovery Philosophy

AI failure is a state, not a dead end.

## 21.1 Upload/analysis failure

Keep the valid local photo/draft when possible. Explain the failure and
provide a specific next action.

## 21.2 Recommendation failure

Preserve analysis and preferences.

## 21.3 Preview failure

Preserve recommendation and selected haircut. Allow retry or continue to
a brief without preview.

## 21.4 Save failure

Do not silently discard the active draft.

## 21.5 Quota/cost

Explain limits before an expensive action when relevant. Repeated taps
must not create duplicate paid jobs.

The design should feel trustworthy under failure, not only beautiful in
the happy path.

------------------------------------------------------------------------

# 22. Privacy & Trust by Design

Because the user's face/photo is central to the experience, privacy must
be visible rather than buried.

Design requirements: - consent before AI processing; - no pre-checked
consent; - clear original vs AI simulation labels; - private-by-default
imagery; - no implication that a shared/exported Brief is automatically
public; - deletion controls when storage is enabled; - no private photo
in analytics/logging UI; - no biometric/identity claims.

Trust is part of the premium experience.

------------------------------------------------------------------------

# 23. Accessibility

At minimum: - 360 px primary flow; - adequate text contrast; - semantic
headings; - labels for controls; - visible keyboard focus; -
non-color-only error/status communication; - alt text or appropriate
accessible names for meaningful imagery; - reduced-motion support; -
touch-friendly controls; - original/simulation distinction available in
text, not only visually.

Accessibility must be preserved even when the visual direction is
editorial.

------------------------------------------------------------------------

# 24. Technical Design Direction

This section establishes boundaries, not final provider/model
selections.

## 24.1 Architecture principle

> **Orchestrate the transformation, not technology for technology's
> sake.**

Use AI where reasoning/generation is valuable. Use deterministic
application logic where deterministic behavior is better. Keep human
choice explicit.

## 24.2 Conceptual pipeline

``` text
User Photo
   ↓
Validation + Consent
   ↓
Multimodal Analysis
   ↓
Structured Observation State
   + User Corrections
   + Optional Intent
   ↓
Recommendation Reasoning
   ↓
Structured Recommendation State
   ↓
Transformation Canvas / Exploration
   ↓
User Selection
   ↓
High-quality Selected Preview
   ↓
Structured Haircut Definition
   ↓
Barber Brief
   ↓
Save / Repeat
```

## 24.3 AI runtime

Per the current PRD direction, Google ADK is the AI
runtime/orchestration choice. This does not mean every operation must be
an agent or that multi-agent architecture is required.

Application APIs remain responsible for: - validation; -
authentication/ownership where relevant; - revision consistency; -
quotas; - storage; - error contracts; - privacy/security controls.

## 24.4 Structured outputs

Analysis, recommendation, and haircut definition should use validated
schemas before being consumed by the UI or Brief.

Free-form model prose must not become authoritative product state
without validation.

## 24.5 Image generation/editing

The exact Google image model and editing strategy remain a technical
decision to benchmark.

Evaluation criteria: - identity preservation; - hairstyle fidelity; -
latency; - cost; - controllability; - safety; - consistency; -
suitability for GCP/event constraints.

## 24.6 Graphify / hair representation spike

Graphify is retained as an R&D hypothesis for: 1. lightweight hairstyle
exploration; 2. visual haircut anatomy/definition.

It must earn its place through evidence.

Benchmark against simpler approaches using:

> **quality × latency × cost × identity stability × implementation
> complexity**

If a simpler masking/edit/cache strategy produces the desired
Transformation Canvas, prefer it.

------------------------------------------------------------------------

# 25. Performance & Cost Design

The design must respect that AI calls have latency and cost.

Principles: - no expensive generation during casual browsing unless
explicitly justified; - selected high-quality preview requires explicit
action; - cache successful active-revision results; - avoid duplicate
jobs; - make retry bounded; - show loading promptly; - allow text/Brief
fallback when image generation is unavailable; - instrument latency and
cost per completed flow without logging private photo content.

A premium experience is not one that generates the most. It is one that
uses generation at the moment of highest user value.

------------------------------------------------------------------------

# 26. Competition Narrative Without Distorting the Product

AI Builder Cup is a delivery milestone, not the reason Cutback exists.

The product design must remain useful if the competition disappears.

However, the design naturally supports a strong proof narrative:

> **In front of judges: prove the orchestration.**\
> **In front of the audience: prove the transformation.**\
> **They are the same journey viewed from different perspectives.**

The intended real demo proof:

> **REAL YOU → ANALYSIS → GROUNDED ADVICE → POSSIBILITY → DECISION →
> BARBER BRIEF → REAL BARBER → REAL YOU**

The final competition video should remain real footage led by the
founder/user. AI preview and motion explain possibility/orchestration;
real barber footage and the actual result provide proof.

Do not fabricate impact or imply guaranteed haircut equivalence.

------------------------------------------------------------------------

# 27. Alignment Matrix

  -----------------------------------------------------------------------
  Experience        Purpose           Requirement       Design principle
  ----------------- ----------------- ----------------- -----------------
  Upload            Establish reality FR-01             User is the
                                                        anchor

  Analysis          Understand        FR-02             Grounded in You
                    observable                          
                    reality                             

  Preferences       Capture desired   FR-04             Reality + Intent
                    direction                           

  Recommendations   Produce grounded  FR-03             Explain why
                    options                             

  Transformation    Experience        FR-03/05 design   Same You.
  Canvas            possibilities     layer             Different
                                                        Possibilities

  Selection         Commit to user    FR-03             Human decides
                    choice                              

  Final Preview     Visualize         FR-05             Possibility, not
                    selected future                     promise

  Haircut           Make the look     FR-06/07 design   Image → Structure
  Definition        understandable    layer             

  Barber Brief      Make choice       FR-07             From possibility
                    actionable                          to action

  Save              Preserve          FR-08             Remember what
                    successful                          worked
                    decision                            

  Repeat            Reuse without     FR-11             Your best
                    unnecessary AI                      haircut,
                                                        remembered

  Actual result     Close reality     FR-09, later      Reality validates
                    loop                                
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# 28. Design Gate for New Ideas

Any new core design idea must answer four questions.

### 1. Does it ground?

Does it make advice more connected to the user's actual observable
reality or stated intent?

### 2. Does it transform?

Does it move the user meaningfully from current state toward a desired
possibility?

### 3. Does it clarify?

Does it improve understanding or decision-making rather than merely add
spectacle?

### 4. Does it connect to reality?

Does it help turn a digital possibility into an actionable, repeatable
real-world haircut?

If an idea does not pass these gates, it should not enter the core
experience. It may be parked for later exploration.

------------------------------------------------------------------------

# 29. Explicit Non-Goals for This Design Lock

The current design does not require: - barber marketplace; - booking; -
payments; - production ads; - barber dashboard/account; - Android native
app; - Play Store release; - live AR; - 3D head reconstruction; -
multi-angle generation; - custom model training; - free-form hair
painting; - AI-generated competition film replacing real footage; -
multi-agent architecture solely for complexity; - guaranteed physical
match to AI preview.

These can only enter the active scope through an explicit
product/requirements decision.

------------------------------------------------------------------------

# 30. Open Design / Technical Experiments

These items are intentionally **not locked**:

1.  Best rendering method for Transformation Canvas.
2.  Whether Graphify materially improves exploration or definition.
3.  Exact image generation/editing model.
4.  Exact HaircutSpec schema.
5.  Exact visual vocabulary for face/hair observations.
6.  Whether recommendation exploration uses references, lightweight
    personalized variants, or a hybrid before final preview.
7.  Final persistence mode: local vs account-backed.
8.  Exact navigation model outside the focused transformation.
9.  Exact typography families and token values.
10. Exact motion durations/easing.
11. Exact final CTA/copy variants.
12. Whether actual-result capture is promoted into MVP after validation.

Experiments may change implementation but must preserve the locked
design invariants.

------------------------------------------------------------------------

# 31. Acceptance of the Design Direction

Design v1 is considered aligned when a prototype can demonstrate the
following without relying on explanation from the designer:

1.  A user begins from their own photo.
2.  The system visibly distinguishes observed reality from user intent.
3.  Recommendations explain why they are relevant.
4.  The user can explore possibilities while remaining visually the same
    person.
5.  The user explicitly chooses the haircut.
6.  Only the selected choice proceeds to the high-quality personal
    preview in the baseline flow.
7.  Original and simulation are clearly distinguishable.
8.  The selected look can be translated into a Barber Brief without
    inventing unsupported measurements.
9.  Failure of preview does not destroy the journey.
10. A saved haircut can be reopened/repeated without unnecessary AI
    generation.
11. The primary flow works at 360 px without horizontal overflow.
12. Motion communicates state/understanding and has a reduced-motion
    alternative.
13. The experience visually reflects the selected Dark/Navy identity.
14. The product feels like one transformation rather than a set of
    disconnected AI tools.

------------------------------------------------------------------------

# 32. Final Design Lock

The following direction is now locked:

> # **CUTBACK --- TRANSFORMATION JOURNEY**
>
> **Reality → Understanding → Grounded Advice → Possibility → Decision →
> Definition → Action → Reality → Memory**
>
> **Grounded in You.**\
> **Same you. Different possibilities.**\
> **Hair is the variable. Identity is the anchor.**\
> **The user decides.**\
> **AI enables possibility.**\
> **Cutback turns possibility into something actionable.**\
> **The barber can make it real.**\
> **Cutback remembers what worked.**

### Product promise

> **Your best haircut, remembered.**

### Consumer promise

> **Bikin rambut impian lo jadi nyata.**

### Design rule

> **Lock the direction. Iterate the execution.**

------------------------------------------------------------------------

## Appendix A --- Primary Requirement Trace

This design is intended to implement the active v0.3 requirements,
especially:

-   FR-01 Upload and photo validation
-   FR-02 Photo analysis
-   FR-03 Hairstyle recommendations
-   FR-04 Optional preferences
-   FR-05 Selected personalized preview
-   FR-07 Barber Brief
-   FR-08 Save/manage haircut
-   FR-11 Repeat saved haircut
-   FR-10 cross-feature revision, loading, retry, duplicate-job and
    quota rules
-   NFR-01 mobile usability
-   NFR-02 security
-   NFR-03 privacy
-   NFR-05 performance
-   NFR-06 schema/integrity
-   NFR-07 observability
-   NFR-08 cost control

FR-09 actual-result documentation remains a later capability unless
scope is explicitly changed.

------------------------------------------------------------------------

## Appendix B --- Reference Visual Interpretation

The selected Dark/Navy reference is accepted as the final visual
direction for Design v1.

What is adopted: - dark navy / near-black premium environment; - warm
restrained accent; - editorial typography; - large portrait-led
composition; - subtle classic barbershop cues; - clean professional
Barber Brief; - minimal, deliberate interface chrome; - masculine,
refined, confident tone.

What is **not** adopted blindly: - stock/model imagery as a substitute
for the user's own transformation; - card-first recommendation as the
final core interaction; - tiny decorative typography for critical
content; - any layout that compromises 360 px usability; - any visual
effect that makes AI simulation look like a guaranteed real result.

The reference defines the **visual character**.\
The Transformation Journey defines the **product experience**.
