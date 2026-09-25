# CUTBACK — DESIGN.md MASTER PROMPT

You are acting as a **senior product designer, mobile UX architect, design systems architect, brand designer, and AI product strategist**.

Your task is to create a production-grade:

`/docs/design/DESIGN.md`

for **Cutback**, a mobile-first AI haircut companion.

This is not a generic UI design exercise.

This document will become the design source of truth used by future designers, coding agents, and developers.

The result must be:

* grounded in the latest Cutback PRD and Requirements;
* optimized primarily for smartphone use;
* visually distinctive enough for a competitive AI product;
* realistic to implement as a web MVP;
* suitable for the AI Builder Cup 2026 demo;
* precise enough that implementation does not require guessing;
* intentionally designed rather than template-generated.

Do **not** implement UI or write application code yet.

Your task is to research, reason, establish the design direction, and produce `DESIGN.md`.

---

# 1. SOURCE OF TRUTH

Before making any design decision, read all available Cutback product documentation.

Priority:

1. latest active Cutback Requirements
2. latest active Cutback PRD
3. existing user-flow documentation if available
4. existing wireframes/designs
5. older Cutback documents only as historical context

The **latest Requirements are the primary functional source of truth**.

The PRD defines product purpose, scope, delivery strategy, positioning, and product priorities.

Do not silently resurrect behavior from an older version.

Do not introduce product behavior simply because it makes a screen visually interesting.

If an old design conflicts with the latest Requirements:

**follow the latest Requirements.**

If a required implementation decision has intentionally been deferred to `design.md`, make a clear design recommendation and mark assumptions appropriately.

Do not change functional product scope in this task.

---

# 2. PRODUCT UNDERSTANDING

Cutback is a **mobile-first web application** that helps a user:

1. upload a current photo;
2. validate whether the photo is suitable;
3. receive an AI-assisted analysis;
4. receive curated haircut recommendations;
5. optionally apply preferences;
6. choose one haircut;
7. generate a preview only for the selected haircut;
8. understand the selected haircut;
9. receive a practical Barber Brief;
10. save the haircut;
11. reopen that haircut later without repeating unnecessary AI generation.

Core product value is not merely:

> “Generate a haircut image.”

Cutback solves three connected problems:

### Discover

“I don't know which haircut I should ask for.”

### Communicate

“I know roughly what I want, but I don't know how to explain it to my barber.”

### Remember

“I had a great haircut before, but I don't know how to ask for the same thing again.”

The experience should therefore feel like a **personal haircut consultation**, not a hairstyle image generator.

The user journey must preserve this logic:

**Upload → Validate → Analyze → Recommend → Choose → Preview → Barber Brief → Save → Reopen**

Preferences remain optional.

Preview generation occurs only after a haircut has been selected.

Do not create previews for every recommendation automatically.

---

# 3. PLATFORM

Cutback is a:

**mobile-first web application.**

Primary environment:

**smartphone**

Primary design widths:

* 360 px
* 390 px
* 430 px

Desktop remains supported, but desktop must not determine the mobile layout.

Native Android and Play Store publication are later milestones and are **not part of the current MVP design requirement**.

The interface must work from **360 px without horizontal scrolling in the primary journey**.

Internal target for important touch controls:

**minimum 44 × 44 CSS px**

Design for real smartphone conditions:

* one-handed use where practical;
* virtual keyboard;
* safe areas;
* browser chrome;
* interrupted connectivity;
* camera/gallery selection;
* users moving temporarily to another app;
* photo-heavy content;
* uncertain AI response time.

Do not design a desktop product and compress it into a phone.

---

# 4. DESIGN AMBITION

Cutback must not look like another generic AI application.

The product is being built in an environment where many competing products will use similar AI capabilities.

Visual polish alone is not enough.

The design must create a recognizable product identity.

Ask continuously:

> Why does this look like Cutback?

> Why would someone remember Cutback after seeing dozens of AI demos?

> Does the UI communicate a real consumer product or a hackathon prototype wrapped in gradients?

Reject directions that could become another AI startup merely by changing the logo.

---

# 5. LOCKED ART DIRECTION

The chosen visual direction is:

## DARK PREMIUM BARBERSHOP

Primary visual foundation:

* deep navy;
* near-black / charcoal;
* warm ivory typography;
* restrained brass or muted gold accents;
* haircut photography as primary visual material;
* editorial hierarchy;
* strong negative space;
* controlled geometry;
* tactile material cues used very selectively.

Influence strength:

**Balanced.**

The aesthetic influence must be noticeable but must never become costume-like.

Dominant reference:

**premium modern barbershop**

Secondary influence may come from:

* bespoke tailoring;
* discreet gentleman culture;
* restrained Art Deco geometry;
* classic editorial menswear;
* premium grooming packaging.

The spirit may borrow qualities associated with refined cinematic gentleman aesthetics, but the product must remain a **modern digital product for 2026**.

Do NOT recreate a movie set.

Do NOT make Cutback look like:

* a Gatsby-themed party invitation;
* a 1920s website;
* a cigar club;
* a whiskey brand;
* a wedding invitation;
* a luxury hotel website;
* a generic black-and-gold template.

The visual language should communicate:

**craft, precision, confidence, grooming, personal attention, discretion and taste.**

---

# 6. TARGET USER FEEL

Primary visual audience:

**20–35 year-old style-conscious modern professionals.**

The design should appeal to someone who cares about looking better but may not consider himself a fashion expert.

Avoid making the product:

* teenage;
* overly streetwear-driven;
* excessively corporate;
* old-fashioned;
* hyper-masculine;
* macho;
* elitist;
* fashion-industry inaccessible.

The desired emotional response is closer to:

> “This knows grooming.”

than:

> “This is a luxury brand trying very hard to look expensive.”

---

# 7. EXPERIENCE THESIS

Develop one concise design thesis for Cutback.

The thesis should represent something approximately at this conceptual level:

> Cutback should feel like a private premium haircut consultation translated into a modern mobile experience.

Do not automatically copy this sentence.

Research first.

Then create the strongest Cutback-specific articulation.

The thesis must influence:

* composition;
* typography;
* photography;
* recommendation hierarchy;
* transitions;
* preview presentation;
* Barber Brief;
* saved haircut archive;
* motion;
* navigation.

Create **4–6 design principles** derived from this thesis.

They should be operational principles, not marketing slogans.

---

# 8. REFERENCE-FIRST RESEARCH

Do not design solely from intuition.

Follow this sequence:

**Requirements → Research → Pattern Extraction → Principles → System → Screen Guidance**

Use the strongest design-reference capability available in the environment.

Preferred order:

1. Inspo MCP or equivalent curated design-reference tooling;
2. browser/web research;
3. Figma/community references if available;
4. other credible production UI references.

If one tool is unavailable:

**continue using the best available alternative.**

Do not stop simply because Inspo MCP is unavailable.

Do not claim to have reviewed a source you could not access.

Do not fabricate screenshots, products, URLs, research findings, or usability evidence.

---

# 9. RESEARCH DOMAINS

Research approximately **6–10 strong references**.

Do not search only for “haircut apps”.

Explore high-quality production experiences from adjacent categories such as:

* premium grooming;
* barbershop brands;
* menswear;
* bespoke tailoring;
* editorial fashion;
* fragrance;
* skincare;
* premium visual commerce;
* personal styling;
* virtual try-on;
* photo-based consumer apps;
* recommendation experiences;
* before/after interaction;
* premium hospitality interfaces;
* luxury retail;
* personal archives / collections;
* camera-first mobile experiences.

Use adjacent categories to extract patterns—not to copy visual identity.

---

# 10. REFERENCE ANALYSIS

For each relevant reference, analyze:

* information hierarchy;
* mobile composition;
* photography treatment;
* typography;
* use of dark surfaces;
* use of gold/brass accents;
* navigation;
* CTA hierarchy;
* spacing;
* content density;
* interaction;
* recommendation presentation;
* selection state;
* comparison patterns;
* saved/history patterns;
* loading/error treatment;
* perceived personality.

Classify findings into:

### Adopt

Patterns that directly support Cutback.

### Adapt

Patterns worth translating into Cutback's context.

### Avoid

Patterns that would create usability problems, visual cliché, excessive implementation complexity or brand confusion.

Never reproduce one interface wholesale.

---

# 11. VISUAL RESTRAINT

“Premium” must come from:

* proportion;
* typography;
* imagery;
* spacing;
* composition;
* detail;
* consistency;
* motion restraint.

Not from adding more gold.

Gold/brass should function as an accent.

It may be suitable for:

* selected states;
* important dividers;
* small labels;
* icon accents;
* premium detail;
* progress markers;
* focused CTA moments.

It should NOT dominate every:

* button;
* border;
* heading;
* icon;
* card;
* background.

Haircut photography must remain visually legible against the dark system.

Account for dark hair against dark backgrounds.

Use controlled separation through:

* composition;
* tonal contrast;
* image framing;
* subtle border treatment;
* surface elevation only where necessary.

---

# 12. TYPOGRAPHIC PERSONALITY

Explore a paired typography strategy:

### Editorial / Display

Used sparingly for:

* major headlines;
* recommendation reveal;
* selected haircut name;
* certain archive titles;
* controlled brand moments.

### Functional Sans

Used for:

* forms;
* instructions;
* metadata;
* buttons;
* Barber Brief;
* navigation;
* error messages;
* labels.

The serif must feel contemporary and editorial rather than ornamental.

Do not use decorative typography that damages mobile readability.

Typography must support the distinction between:

**emotion / hierarchy**

and

**instruction / utility.**

---

# 13. NAVIGATION — HYBRID AND ADAPTIVE

Navigation must **not be fixed globally by default**.

Use a hybrid adaptive model.

## Core journey

During:

Upload
→ Validation
→ Analysis
→ Recommendation
→ Selection
→ Preview
→ Barber Brief

the interface should feel:

* focused;
* sequential;
* immersive;
* task-oriented.

Navigation should adapt to context.

Possible patterns include:

* contextual back navigation;
* lightweight progress indication;
* sticky action only where useful;
* reduced chrome during photography-heavy moments.

Do not force a persistent bottom navigation bar onto every screen.

## Persistent product areas

Areas such as:

* My Haircuts;
* Saved;
* archive/history;
* settings/account where relevant

may use more conventional navigation.

The final recommendation should emerge from research.

Explain why each navigation pattern is used.

---

# 14. LANDING EXPERIENCE

Use:

**premium storytelling, but short.**

The landing page must not become a long luxury campaign site.

Its job is to:

1. establish Cutback's identity;
2. establish the problem/value proposition;
3. create trust;
4. move the user quickly into the haircut flow.

Prioritize:

* strong portrait photography;
* concise headline;
* clear product promise;
* one dominant primary CTA;
* restrained supporting copy.

Do not bury:

**Find My Haircut**

under multiple marketing sections.

Avoid giant generic startup headlines and excessive scroll before product entry.

---

# 15. PRIMARY MOBILE FLOW

Design guidance must cover at minimum:

1. Landing
2. Upload
3. Photo Validation
4. Analysis
5. Optional Preferences
6. Recommendations
7. Selected Haircut
8. Preview Request
9. Preview Loading
10. Preview Result
11. Barber Brief
12. Save
13. My Haircuts
14. Reopen Saved Haircut

If research shows that some of these should exist as states rather than separate pages, explain that decision.

Do not inflate screen count unnecessarily.

---

# 16. PHOTO UPLOAD EXPERIENCE

Photo upload is the real beginning of the product experience.

Support design patterns for:

* choose from gallery;
* take a photo when supported;
* regular file upload fallback;
* photo preview;
* replace photo;
* consent;
* validation failure.

Explain how camera and file fallback should remain understandable across smartphone browsers.

Do not assume camera capture exists everywhere.

The upload experience should immediately communicate minimum photo quality:

* one person;
* face visible;
* hair visible;
* sufficient lighting.

Do not overload the first screen with technical instructions.

---

# 17. IMAGE QUALITY AND MOBILE PRESENTATION

Photography is central to Cutback.

Define:

* hero image behavior;
* portrait ratios;
* thumbnails;
* cropping;
* safe crop zones;
* dark-hair separation;
* original photo treatment;
* generated preview treatment;
* reference haircut imagery;
* image loading states;
* quality expectations;
* responsive behavior.

Any optimization for mobile performance must preserve enough image quality for AI analysis and meaningful visual comparison.

Do not design tiny preview images.

The original photo and generated result must be inspectable comfortably on a smartphone.

---

# 18. ANALYSIS EXPERIENCE

AI analysis should feel like:

> Cutback is preparing a consultation.

Not:

> An LLM is processing tokens.

Avoid:

* fake percentages;
* fake scanning maps;
* sci-fi HUD interfaces;
* glowing face grids;
* generic AI sparkles;
* fake biometric measurement;
* unnecessary technical language.

The state should provide meaningful reassurance and expectations.

Design:

* initial analysis;
* slower-than-expected state;
* failure;
* retry;
* connection loss;
* return after temporary interruption.

Do not pretend progress can be measured if it cannot.

---

# 19. OPTIONAL PREFERENCES

Preferences are optional.

The interface must not imply that a user must complete a questionnaire before Cutback becomes useful.

Potential preference areas include:

* vibe;
* desired length;
* styling effort;
* optional notes.

Keep interaction lightweight.

Do not recreate a long onboarding survey.

Avoid excessive pill/chip UI if a more elegant selection pattern works better.

---

# 20. RECOMMENDATION EXPERIENCE — CORE MOMENT

This is one of Cutback's most important screens.

Locked information architecture direction:

## 1 primary recommendation

Presented editorially as the strongest recommendation.

## 2 alternatives

Available for comparison without visually competing equally with the primary recommendation.

The experience should feel:

**curated**

rather than:

**generated.**

The primary recommendation should communicate:

* haircut name;
* strong imagery;
* why it fits;
* styling effort;
* length characteristics;
* relevant constraints;
* trade-offs where appropriate.

Do not communicate invented mathematical confidence.

Avoid fake scores such as:

“97% compatible”

unless the product actually has a meaningful validated metric.

Explore language such as:

* Recommended;
* Best Match;
* Cutback Selection;
* Recommended for You;

and recommend terminology based on clarity and tone.

Selection state must be unmistakable.

Selecting another recommendation must visually transfer focus correctly.

---

# 21. PREVIEW — SIGNATURE PRODUCT MOMENT

Preview occurs only **after the user selects a haircut**.

This sequence is important.

Selection should create anticipation.

Preview should feel like a reward for making the decision.

However:

**do not pre-select the interaction pattern.**

Research multiple mobile comparison patterns, including where relevant:

* swipe/drag before-after;
* press-and-hold original;
* Original / Preview toggle;
* side-by-side;
* stacked comparison;
* other credible patterns.

Evaluate them for:

* 360 px usability;
* discoverability;
* one-handed operation;
* ability to inspect hair detail;
* accessibility;
* implementation complexity;
* visual impact;
* risk of accidental interaction.

Then choose the strongest pattern.

Document why.

Do not choose something merely because it looks impressive in a demo.

The screen must clearly identify:

* original;
* AI simulation;
* selected haircut;
* generation state;
* failure state;
* retry;
* simulation disclaimer.

The design must not imply the AI preview is a guaranteed barber outcome.

---

# 22. BARBER BRIEF — LUXURY BARBER CONSULTATION CARD

The chosen direction is:

**Luxury Barber Consultation Card**

This screen should be one of Cutback's recognizable assets.

Imagine a premium barbershop consultation artifact translated into a smartphone interface.

But usability wins over decoration.

The brief must be practical enough for the user to physically show the phone to a barber.

Prioritize:

* haircut name;
* relevant visual;
* original/reference image where useful;
* valid preview where available;
* top;
* sides;
* back;
* fade/taper;
* texture;
* styling;
* notes;
* unknown values;
* instructions requiring confirmation.

Unknown details must remain clearly unknown.

Do not fabricate precision for visual polish.

Typography must remain readable in a real barbershop.

Avoid tiny labels.

Avoid low-contrast gold text on dark backgrounds.

Avoid unnecessary animation.

The Barber Brief should visually communicate:

> “Here is exactly what we discussed.”

not:

> “Here is another pretty AI result.”

---

# 23. SAVED HAIRCUTS

Saved results are a major part of Cutback's product value.

Use clear navigation terminology:

**My Haircuts**

Do not sacrifice understanding for branding.

However, the visual treatment may evoke:

**a personal grooming archive.**

This means saved haircuts should feel more meaningful than browser history.

Users should quickly understand:

* haircut name;
* date;
* primary image;
* selected look;
* ability to reopen brief;
* ability to repeat the cut.

The interface may use subtle editorial archive cues.

Do not rename the main navigation to something cryptic like “Vault” purely for style.

You may use conceptual language such as “Your Archive” as supporting editorial copy if it improves personality without harming clarity.

---

# 24. DRAFT AND CONTINUITY BEHAVIOR

The latest Requirements govern persistence behavior.

Do not invent stronger persistence than the product guarantees.

Design explicitly for:

### Navigation inside the flow

Draft should remain available according to product requirements.

### Temporary app switching

The interface should tolerate normal smartphone context switching where browser state remains available.

### Refresh

Do not promise unsaved draft persistence unless the technical design explicitly provides it.

If refresh may lose an unsaved draft, provide an appropriate warning only where justified.

### Saved haircut

A successfully saved haircut must visually behave as persistent data.

Clearly differentiate:

* temporary flow state;
* saved haircut;
* AI job still processing;
* stale result where applicable.

---

# 25. CONNECTIVITY AND AI FAILURE

Mobile users may lose network connectivity.

Design states for:

* connection lost before request;
* connection lost while awaiting AI response;
* timeout;
* provider failure;
* retry;
* returning to a screen after interruption;
* result from an older revision arriving late.

Never create UI behavior that encourages duplicate AI jobs.

Disable or protect duplicate actions while the same operation is pending.

Retry should be deliberate.

Do not automatically imply that pressing Retry always creates a new provider call.

The visual system must make state understandable without exposing unnecessary technical details.

---

# 26. BUTTON AND ACTION BEHAVIOR

Define:

* primary action;
* secondary action;
* tertiary action;
* destructive action;
* disabled;
* loading;
* pending;
* sticky action behavior;
* inline action behavior.

Primary touch targets:

**minimum 44 × 44 CSS px**

Avoid tiny icon-only controls for important actions.

A sticky bottom CTA is not mandatory.

Use it only when it improves task completion.

Account for:

* mobile browser viewport;
* bottom safe area;
* virtual keyboard;
* long pages;
* image inspection.

---

# 27. VIRTUAL KEYBOARD

Explicitly define behavior for forms and notes.

When the mobile keyboard opens:

* active input must remain visible;
* important validation messages must remain reachable;
* the user must still be able to reach the next action;
* sticky actions must not be hidden behind the keyboard;
* layouts must not produce horizontal overflow;
* textarea use must remain practical.

Do not assume desktop keyboard behavior.

---

# 28. RESPONSIVE SYSTEM

Primary breakpoints are not merely framework breakpoints.

Describe behavior at:

### 360 px

Minimum supported smartphone width.

### 390 px

Representative modern smartphone width.

### 430 px

Larger smartphone.

### Tablet

Use additional space intentionally.

### Desktop

Do not stretch a narrow mobile column infinitely.

Define:

* maximum reading width;
* photo widths;
* recommendation layout;
* comparison behavior;
* Barber Brief adaptation;
* saved haircut layout;
* navigation adaptation.

Desktop should feel deliberately adapted from the same product, not like a second unrelated application.

---

# 29. DESIGN SYSTEM

Create a practical system.

At minimum define:

## Color

Include semantic roles such as:

* canvas;
* surface;
* elevated surface;
* text primary;
* text secondary;
* text muted;
* border;
* accent brass/gold;
* interactive;
* selected;
* success;
* warning;
* error;
* disabled.

Provide actual recommended color tokens.

Dark navy—not pure black—should be considered where appropriate.

Accessibility must constrain gold usage.

## Typography

Define:

* display;
* H1;
* H2;
* H3;
* body;
* compact body;
* label;
* caption;
* button;
* numeric/meta if needed.

Include mobile sizes and line-height guidance.

## Spacing

Define a repeatable scale.

## Radius

Use restraint.

Not every element needs a large rounded rectangle.

## Borders / Dividers

This visual direction may use fine editorial/tailoring-inspired rules more often than heavy cards.

## Buttons

Define all functional states.

## Inputs

Define:

* text input;
* textarea;
* segmented/select controls where justified;
* preference controls;
* upload control.

## Images

Define ratios, cropping and labels.

## Feedback

Define:

* skeleton;
* pending;
* success;
* warning;
* error;
* empty;
* offline.

---

# 30. CARD DISCIPLINE

Do not build Cutback as “cards inside cards.”

Use:

* composition;
* typography;
* images;
* dividers;
* spacing;
* background contrast

before introducing a container.

A card should exist because information needs grouping, not because every UI generator defaults to a card.

Especially avoid:

* recommendation card grids;
* nested cards;
* pill overload;
* floating glass panels.

---

# 31. MOTION

Create a restrained motion language.

Desired qualities:

* deliberate;
* smooth;
* premium;
* calm;
* functional.

Possible useful areas:

* screen continuity;
* recommendation reveal;
* selection transition;
* preview reveal;
* comparison transition;
* save confirmation.

Avoid:

* decorative particles;
* constant movement;
* large parallax;
* unnecessary loading animation;
* overdramatic page transitions.

Define approximate duration bands and easing philosophy.

Respect `prefers-reduced-motion`.

Motion must never be required to understand state.

---

# 32. SIGNATURE MOMENTS

Create at least **3 Cutback-specific signature moments**.

At least two must occur inside the actual product journey.

Do not make all signature moments landing-page decoration.

Good candidate areas include:

* photo accepted → consultation begins;
* recommendation reveal;
* haircut selection;
* preview reveal/comparison;
* Barber Brief;
* saved haircut reopening.

For every signature moment explain:

1. user context;
2. interaction;
3. visual treatment;
4. why it belongs specifically to Cutback;
5. user benefit;
6. implementation complexity.

Classify:

* Core
* High-impact polish
* Optional stretch

A signature moment must improve:

* confidence;
* understanding;
* delight;
* product storytelling;
* perceived quality.

Not merely spectacle.

---

# 33. ACCESSIBILITY

The premium aesthetic must not compromise usability.

Account for:

* WCAG-conscious contrast;
* dark-mode readability;
* restrained gold contrast;
* 44 × 44 CSS px touch targets;
* keyboard navigation;
* visible focus;
* semantic heading hierarchy;
* alt-text strategy;
* readable text;
* reduced motion;
* error messages not dependent on color;
* status announcements;
* comparison interaction accessibility.

Call out any aesthetic decision that risks accessibility.

---

# 34. REAL DEVICE TEST EXPECTATIONS

The design must explicitly prepare for verification on:

* Chrome Android
* Safari iOS

Differentiate:

### Emulator / responsive simulation

Useful for layout iteration.

### Real-device evidence

Needed to validate real mobile interaction.

Design QA should include:

* 360 px overflow;
* safe area;
* photo picker;
* camera invocation where supported;
* virtual keyboard;
* sticky controls;
* orientation behavior if relevant;
* image inspection;
* long Barber Brief;
* network interruption;
* scrolling;
* browser chrome.

Do not claim real-device validation unless it has actually occurred.

---

# 35. AI BUILDER CUP CONTEXT

Cutback targets the:

**Retail & Commerce**

theme.

The product framing is customer experience:

**helping a customer choose, communicate and repeat a haircut.**

Do not distort the product merely to impress judges.

The design should visibly support evidence for:

* real AI usage;
* end-to-end product flow;
* meaningful personalization;
* usable preview;
* practical Barber Brief;
* reopening a saved haircut;
* coherent mobile experience.

The demo journey should make these visible without excessive explanation.

Do not add:

* charts;
* dashboards;
* unnecessary agent interfaces;
* features;
* fake analytics;
* admin panels

solely to make the project appear technically sophisticated.

Competition judging should influence **proof and polish**, not inflate product scope.

---

# 36. HACKATHON FEASIBILITY

Classify notable design ideas as:

### Core

Necessary to communicate the product properly.

### High-impact polish

Visible improvement worth implementation effort.

### Optional stretch

Useful only if core product is stable.

Prioritize:

**visible product quality / implementation effort.**

Do not make the MVP dependent on:

* complex WebGL;
* 3D;
* AR;
* custom shaders;
* heavy animation;
* multi-angle AI generation;
* advanced gesture systems with poor fallback.

The design should look ambitious because it is disciplined—not because it is technically extravagant.

---

# 37. DESIGN ANTI-PATTERNS

Include a section exactly named:

# Do Not Do This

At minimum prohibit:

* generic purple/blue AI gradients;
* neon AI styling;
* sparkles as AI identity;
* glassmorphism everywhere;
* black-and-gold luxury cliché;
* too much gold;
* Gatsby costume styling;
* whiskey/cigar-club aesthetic;
* dashboard layouts;
* excessive cards;
* cards inside cards;
* every option represented as a pill;
* excessive roundness;
* fake AI percentages;
* face-scanning sci-fi effects;
* tiny controls;
* low-contrast dark UI;
* gold body text on dark backgrounds;
* dark hair disappearing into dark surfaces;
* desktop layout compressed into mobile;
* permanently fixed navigation regardless of context;
* automatic generation for all haircut recommendations;
* recommendation accuracy percentages without evidence;
* preview treated as guaranteed real outcome;
* Barber Brief optimized for beauty instead of clarity;
* hidden retry/error states;
* stale preview presented as current;
* implied persistence the backend does not guarantee;
* arbitrary UI features not present in requirements;
* competition-only feature bloat.

Add additional Cutback-specific anti-patterns discovered during research.

---

# 38. REQUIRED DESIGN.MD STRUCTURE

Create `/docs/design/DESIGN.md` containing at minimum:

1. Document Status
2. Source Documents
3. Design Mission
4. Product Experience Goal
5. User and Context
6. Research Method
7. Reference Analysis
8. Pattern Extraction
9. Design Thesis
10. Design Principles
11. Brand Personality
12. Art Direction
13. Color System
14. Typography
15. Spacing
16. Radius and Borders
17. Photography and Imagery
18. Iconography
19. Buttons and Inputs
20. Navigation Model
21. Mobile Layout Rules
22. Responsive Rules
23. Upload Experience
24. Validation Experience
25. Analysis Experience
26. Optional Preferences
27. Recommendation Experience
28. Haircut Selection
29. Preview Experience
30. Barber Brief
31. Saving Experience
32. My Haircuts / Personal Archive
33. Reopen / Repeat Experience
34. Loading States
35. Error / Retry / Offline States
36. Draft and Continuity Behavior
37. Motion System
38. Accessibility
39. Signature Moments
40. AI Builder Cup Demo Considerations
41. Hackathon Priority Classification
42. Do Not Do This
43. Design QA Checklist
44. Open Design Decisions
45. Requirement Traceability

---

# 39. REQUIREMENT TRACEABILITY

DESIGN.md must not become a disconnected mood board.

Where relevant, map design decisions back to functional or non-functional requirements.

Especially cover requirements involving:

* mobile width;
* upload;
* camera/file fallback;
* photo validation;
* optional preferences;
* recommendation hierarchy;
* selected model;
* preview;
* Barber Brief;
* save/reopen;
* loading;
* error;
* retry;
* duplicate jobs;
* stale result handling;
* offline/network interruption;
* privacy messaging;
* touch targets;
* keyboard behavior;
* responsive behavior.

Do not alter requirement IDs.

---

# 40. OPEN DECISIONS

Do not hide uncertainty.

For unresolved choices, explicitly state:

* decision;
* available options;
* recommendation;
* reason;
* implementation impact;
* what evidence could change the decision.

In particular, research rather than prematurely locking:

* preview comparison interaction;
* exact typefaces;
* exact navigation detail;
* exact recommendation terminology;
* exact image ratios where device testing may affect the choice.

---

# 41. FINAL QUALITY GATE

Before finalizing DESIGN.md, critically review the entire direction.

Reject and revise the proposal if:

* it looks like a generic AI startup;
* it looks like a generic black-and-gold luxury template;
* it resembles a themed Gatsby website;
* it feels like a SaaS dashboard;
* haircut imagery is secondary;
* recommendation presentation feels auto-generated rather than curated;
* dark UI reduces hair visibility;
* mobile UX feels like compressed desktop;
* navigation appears because “apps need bottom navigation” rather than because users need it;
* preview is visually impressive but confusing;
* Barber Brief is beautiful but inconvenient for a barber;
* Saved Haircuts looks like generic history;
* failure and retry states are weaker than happy-path screens;
* interaction depends on animation;
* design choices contradict current requirements;
* the design implies unimplemented persistence;
* there is no recognizable Cutback visual identity;
* another product could replace the Cutback logo and reuse the system unchanged;
* competition polish has caused product scope inflation.

The final document must clearly answer:

> **Why does Cutback look like Cutback?**

> **What makes Cutback feel like a premium barbershop consultation rather than an AI image generator?**

> **What will a user remember after using it once?**

> **What will a judge understand after seeing the mobile demo once?**

---

# 42. EXECUTION ORDER

Follow this exact order:

1. Read current source documents.
2. Extract functional constraints.
3. Perform reference research.
4. Record reference evidence.
5. Derive patterns.
6. Establish the design thesis.
7. Establish design principles.
8. Define the visual system.
9. Define mobile interaction rules.
10. Define screen guidance.
11. Define signature moments.
12. Define failure/offline/continuity behavior.
13. Map decisions to requirements.
14. Perform competitive and usability critique.
15. Revise weak decisions.
16. Create `/docs/design/DESIGN.md`.
17. Run the final quality gate.

Do not implement the UI.

Do not create production code.

Do not silently expand MVP scope.

Do not claim research, testing, deployment, user validation, or competition readiness that has not actually occurred.

Research first.

Decide second.

Document third.
