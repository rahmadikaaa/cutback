# CUTBACK — FIGMA DESIGN SYSTEM & HANDOFF PROMPT

You are acting as a **senior product designer, design systems architect, mobile UX specialist, and developer-handoff designer**.

Your task is to translate the attached Cutback `DESIGN.md` into a **scalable, implementation-ready Figma design system and a focused set of representative product screens**.

The objective is NOT to create the maximum number of high-fidelity screens.

The objective is to create a design foundation that can be reliably extended by:

* product designers;
* frontend developers;
* coding agents;
* future AI design agents.

The Figma file should become the **visual source of truth for implementation**.

---

# 1. SOURCE OF TRUTH

Read the latest available:

1. Cutback Requirements
2. Cutback PRD
3. Cutback `DESIGN.md`

Priority:

**Requirements → PRD → DESIGN.md**

Use:

* Requirements for product behavior and acceptance constraints.
* PRD for scope, product intent, user value, and priorities.
* DESIGN.md for visual language, UX direction, interaction guidance, and design principles.

Do not silently modify product behavior.

Do not invent new functionality for visual reasons.

If DESIGN.md conflicts with Requirements, Requirements win.

If a design decision remains explicitly open in DESIGN.md, explore it and document the chosen recommendation rather than treating it as already locked.

---

# 2. PRIMARY GOAL

Create a **scalable Figma design system**, not a collection of disconnected screens.

The output should make it possible to design additional Cutback screens later without inventing new:

* colors;
* spacing;
* typography;
* controls;
* layouts;
* states;
* image treatment;
* navigation patterns.

Prefer reusable system decisions over page-specific styling.

Every important visual choice should answer:

> Can this be reused consistently across Cutback?

---

# 3. PRODUCT CONTEXT

Cutback is a **mobile-first AI haircut companion**.

Primary journey:

**Upload → Validate → Analyze → Recommend → Choose → Preview → Barber Brief → Save → Reopen**

Preferences are optional.

Preview is generated only after the user chooses a haircut.

Primary device:

**smartphone**

Primary mobile widths:

* 360 px
* 390 px
* 430 px

Desktop remains supported.

Native Android is not part of the current web MVP.

---

# 4. LOCKED ART DIRECTION

Follow the art direction defined in DESIGN.md.

Current direction:

## Dark Premium Barbershop

Core qualities:

* deep navy;
* near-black charcoal;
* warm ivory;
* restrained brass / muted gold;
* editorial haircut photography;
* premium grooming;
* strong composition;
* controlled negative space;
* precise typography;
* subtle tactile cues;
* modern rather than nostalgic.

Influence strength:

**Balanced**

Dominant personality:

**premium modern barbershop**

Secondary influences may include:

* tailoring;
* editorial menswear;
* subtle Art Deco geometry;
* premium grooming packaging.

Avoid turning the product into:

* Gatsby cosplay;
* cigar club branding;
* whiskey branding;
* generic black-and-gold luxury;
* generic AI SaaS.

---

# 5. DESIGN SYSTEM FIRST

Before designing complete product screens, establish the system.

Create dedicated Figma sections/pages for:

1. Foundations
2. Components
3. Patterns
4. Mobile Screens
5. Responsive Examples
6. States & Edge Cases
7. Handoff / Usage Documentation

Do not begin with dozens of standalone pages.

---

# 6. FOUNDATIONS

Create reusable foundations.

## Color Variables

Use semantic naming.

Suggested categories:

* `bg/canvas`

* `bg/surface`

* `bg/elevated`

* `bg/inverse`

* `text/primary`

* `text/secondary`

* `text/muted`

* `text/inverse`

* `border/default`

* `border/subtle`

* `border/strong`

* `accent/primary`

* `accent/subtle`

* `interactive/default`

* `interactive/hover`

* `interactive/pressed`

* `interactive/disabled`

* `status/success`

* `status/warning`

* `status/error`

* `status/info`

* `selection/default`

* `selection/active`

Do not use raw hex colors repeatedly inside components.

Create variables/tokens first.

Gold/brass should be an accent, not a default text color.

Ensure dark hair remains visible against dark UI surfaces.

---

# 7. TYPOGRAPHY SYSTEM

Create text styles / variables for at least:

* Display
* H1
* H2
* H3
* Body Large
* Body
* Body Small
* Label
* Caption
* Button
* Metadata

Use the typography strategy from DESIGN.md:

### Editorial display type

For controlled brand/editorial moments.

### Functional sans-serif

For controls, descriptions, Barber Brief content, errors, and navigation.

Define:

* font family;
* size;
* line height;
* weight;
* letter spacing;
* intended usage.

Do not style text manually per screen unless there is a justified exception.

---

# 8. SPACING SYSTEM

Create a repeatable spacing scale.

For example, derive a coherent scale such as:

* 4
* 8
* 12
* 16
* 24
* 32
* 40
* 48
* 64

Adjust based on DESIGN.md if required.

Use variables wherever practical.

Define usage examples:

* control internal padding;
* section spacing;
* screen edge padding;
* image spacing;
* component gaps.

Avoid arbitrary one-off values.

---

# 9. RADIUS, BORDER, AND ELEVATION

Create reusable tokens for:

* radius small;
* radius medium;
* radius large;
* full/pill only where genuinely necessary.

Avoid over-rounding.

Define border styles appropriate for the Cutback aesthetic.

Prefer:

* fine dividers;
* subtle outlines;
* tonal surface separation

over large floating cards and excessive shadows.

Create elevation only where there is a meaningful hierarchy.

---

# 10. GRID & MOBILE LAYOUT SYSTEM

Primary design target:

**390 px mobile**

Also create validation examples for:

* 360 px
* 430 px

Define:

* mobile side padding;
* content width;
* vertical rhythm;
* image width behavior;
* full-bleed behavior;
* safe-area handling;
* bottom-action spacing.

Use Auto Layout throughout.

Avoid absolute positioning except where intentionally required for overlays or imagery.

Components and layouts must resize predictably.

---

# 11. CORE COMPONENT LIBRARY

Create reusable components with variants.

At minimum:

## Buttons

* Primary
* Secondary
* Tertiary
* Destructive
* Icon button where justified

States:

* Default
* Hover where relevant
* Pressed
* Focus
* Loading
* Disabled

Important touch targets:

**minimum 44 × 44 CSS px equivalent**

---

## Inputs

Create:

* text field;
* textarea;
* upload field;
* preference selector;
* validation message;
* optional segmented control if supported by design decisions.

States:

* Default
* Focus
* Filled
* Error
* Disabled

---

## Navigation

Create reusable patterns for:

### Core Journey Header

Contextual / adaptive.

### Persistent Area Navigation

For My Haircuts and similar persistent destinations.

Do NOT create one fixed navigation component and force it onto every screen.

---

## Photo Components

Create reusable:

* Hero Portrait
* User Photo
* Haircut Recommendation Image
* Preview Image
* Thumbnail
* Reference Image

Include:

* aspect ratio rules;
* labels;
* loading;
* unavailable/broken state where needed.

---

## Recommendation Components

Create:

### Primary Recommendation

For editorial Best Match / primary suggestion.

### Alternative Recommendation

For the two secondary suggestions.

States:

* Default
* Selected
* Pressed/interactive
* Unavailable if relevant

The primary recommendation must visually dominate without using a fake accuracy score.

---

## Status Components

Create reusable patterns for:

* Loading
* Offline
* Error
* Warning
* Success
* Empty State

---

## Barber Brief Components

Create reusable elements for:

* haircut title;
* reference imagery;
* detail row;
* section divider;
* top;
* sides;
* back;
* fade/taper;
* texture;
* styling;
* notes;
* unknown / confirm-with-barber state.

The Barber Brief should feel premium but remain functionally readable.

---

## Saved Haircut Components

Create reusable:

* Saved Haircut Item
* Saved Haircut Hero
* Date / metadata treatment
* Reopen action
* Repeat action where appropriate

---

# 12. COMPONENT PROPERTIES

Where appropriate, use Figma component properties and variants rather than duplicate components.

Examples:

`Button`

* hierarchy
* state
* icon
* width behavior

`Recommendation`

* primary / alternative
* selected / unselected

`Image`

* original / preview / reference
* loading / ready / failed

`Status`

* loading / error / offline / success

`BriefRow`

* field type
* known / unknown

Use names that a developer can understand without opening every component.

---

# 13. AUTO LAYOUT

Auto Layout is mandatory for normal UI composition.

Use it for:

* screen sections;
* cards where necessary;
* buttons;
* recommendation blocks;
* lists;
* forms;
* Barber Brief;
* Saved Haircuts.

Avoid manually positioning children when Auto Layout can represent the same structure.

The Figma file should behave more like a responsive interface than a static poster.

---

# 14. RESPONSIVE COMPONENT BEHAVIOR

Define resizing behavior.

Use:

* Fill container
* Hug contents
* Fixed width only when required
* min/max constraints where appropriate

Document which elements:

* stretch;
* wrap;
* remain fixed;
* become multi-column on larger screens;
* remain centered at a max-width.

Do not create separate components for every device width when responsive behavior can handle it.

---

# 15. REPRESENTATIVE SCREENS

Do NOT design the entire product exhaustively yet.

Create enough screens to prove the system.

Required representative screens:

## 1. Landing

Prove:

* brand;
* dark visual language;
* photography;
* CTA;
* typography.

## 2. Upload

Prove:

* form styling;
* photo upload;
* guidance;
* consent;
* primary action.

## 3. Recommendations

Prove:

* editorial primary recommendation;
* two alternatives;
* selected state;
* recommendation metadata.

## 4. Preview

Prove:

* original vs AI simulation;
* selected haircut context;
* comparison interaction selected in DESIGN.md;
* retry/error treatment.

## 5. Barber Brief

Prove:

**Luxury Barber Consultation Card**

This should demonstrate the strongest intersection of:

* premium visual identity;
* practical information architecture;
* mobile readability.

## 6. My Haircuts

Prove:

* personal archive;
* saved haircut presentation;
* reopen affordance.

These six screens should validate whether the system scales.

---

# 16. KEY STATES

Do not show only happy paths.

Create representative component/screen states for:

* photo validation failed;
* AI analysis loading;
* AI analysis failed;
* offline/network interrupted;
* recommendation selected;
* preview loading;
* preview failed;
* saved successfully;
* empty My Haircuts.

Where possible, use component variants rather than entirely independent screens.

---

# 17. PREVIEW INTERACTION

Do not invent a comparison interaction if DESIGN.md already selected one.

If DESIGN.md leaves it open:

evaluate:

* swipe comparison;
* toggle Original / Preview;
* tap-and-hold comparison;
* stacked comparison;
* other credible pattern.

Choose based on:

* mobile usability;
* accessibility;
* hair inspection;
* implementation feasibility;
* clarity.

Document the decision.

---

# 18. BARBER BRIEF

The Barber Brief is a critical handoff artifact inside the product itself.

Design it as a:

**Luxury Barber Consultation Card**

But prioritize barber readability.

A barber should be able to understand the important instructions in seconds.

Avoid:

* tiny gold text;
* decorative information hierarchy;
* excessive ornament;
* hidden details.

Treat this screen almost as a specification sheet with premium editorial styling.

---

# 19. NAVIGATION

Follow the hybrid adaptive navigation direction.

Core flow:

* focused;
* contextual;
* minimal chrome.

Persistent areas:

* clearer app-level navigation where appropriate.

Do not force a permanent bottom navigation across the entire flow.

Create navigation as reusable patterns rather than unique screen-by-screen solutions.

---

# 20. MOBILE-FIRST CONSTRAINTS

Validate all representative screens at:

**360 px**

Requirements:

* no horizontal scroll;
* no clipped content;
* no tiny controls;
* images remain inspectable;
* CTA remains reachable;
* typography remains readable;
* Barber Brief remains usable.

Also consider:

* mobile browser safe area;
* virtual keyboard;
* large text;
* longer localization strings;
* dynamic error messages.

---

# 21. DESKTOP / LARGE-SCREEN EXAMPLE

Create only enough desktop treatment to demonstrate responsive strategy.

Do not redesign the product as a desktop dashboard.

Demonstrate approximately:

* Landing
* Recommendations
* Barber Brief or My Haircuts

Show how:

* mobile column gains space;
* photography can grow;
* content reaches a max width;
* layout may become split or multi-column where beneficial.

Document the responsive rule rather than producing dozens of desktop screens.

---

# 22. ACCESSIBILITY

Build accessibility into the design system.

Account for:

* readable contrast;
* gold/brass limitations;
* 44 × 44 minimum touch targets;
* visible focus;
* readable type size;
* errors not relying on color alone;
* meaningful selected states;
* reduced-motion-compatible interaction;
* clear disabled state.

Flag any aesthetic decision that may be risky.

---

# 23. DESIGN TOKENS FOR IMPLEMENTATION

Prepare tokens so they can map cleanly to implementation.

Where possible, structure variables so they could later translate into:

* CSS variables;
* Tailwind theme values;
* design-token JSON;
* component theme configuration.

Prefer semantic names over presentation names.

Good:

`text-primary`

Bad:

`cream-text-01`

Good:

`surface-elevated`

Bad:

`navy-card`

---

# 24. NAMING CONVENTIONS

Use clear component naming.

Examples:

`Button/Primary`

`Button/Secondary`

`Input/Text`

`Input/Textarea`

`Recommendation/Primary`

`Recommendation/Alternative`

`Photo/User`

`Photo/Preview`

`Status/Error`

`Status/Offline`

`Navigation/CoreHeader`

`Navigation/App`

`BarberBrief/DetailRow`

`SavedHaircut/Item`

Use nested naming logically.

Avoid names such as:

`Card 32`

`Rectangle Copy`

`Final Component New`

---

# 25. FIGMA FILE STRUCTURE

Suggested structure:

## 00 — Cover

Product:
Cutback

Design direction:
Dark Premium Barbershop

Version / date.

---

## 01 — Foundations

* Colors
* Typography
* Spacing
* Radius
* Borders
* Elevation
* Grid

---

## 02 — Components

Reusable component library.

---

## 03 — Patterns

* Navigation
* Forms
* Recommendation
* Preview
* Barber Brief
* Saved Haircuts
* Status / Error

---

## 04 — Mobile Screens

Representative screens.

---

## 05 — Responsive

360 / 390 / 430 / desktop examples.

---

## 06 — States

Loading / Error / Offline / Empty / Selected.

---

## 07 — Handoff

Usage guidance.

---

# 26. HANDOFF DOCUMENTATION

For important components, document:

### Purpose

What problem it solves.

### Usage

When to use it.

### Avoid

When not to use it.

### Variants

Available component states.

### Responsive behavior

How it resizes.

### Content behavior

How it handles long text.

### Accessibility notes

Any specific considerations.

Do not assume developers will infer this from appearance alone.

---

# 27. DESIGN → DEVELOPMENT TRACEABILITY

Where useful, annotate representative patterns with related requirement IDs.

Especially:

* mobile minimum width;
* touch targets;
* upload behavior;
* optional preferences;
* recommendation selection;
* preview;
* Barber Brief;
* save/reopen;
* loading;
* offline;
* duplicate-job protection;
* stale state;
* virtual keyboard behavior.

Do not rewrite requirements inside Figma.

Use concise annotations.

---

# 28. DO NOT DO THIS

Do not create:

* dozens of isolated high-fidelity screens;
* page-specific visual systems;
* manually positioned layouts that break when resized;
* detached components with no variants;
* duplicate buttons for every screen;
* random spacing values;
* hardcoded colors everywhere;
* arbitrary typography values;
* excessive cards;
* excessive pills;
* excessive gradients;
* glassmorphism;
* generic AI sparkles;
* permanent navigation everywhere;
* inaccessible gold-on-dark text;
* visual-only selection states;
* fake AI progress percentages;
* dashboard layouts;
* unnecessary charts;
* AR/3D concepts;
* Android-native screens;
* new product features absent from current requirements.

---

# 29. QUALITY GATE

Before considering the Figma system complete, verify:

## System

* Colors use variables.
* Typography uses defined styles.
* Spacing is systematic.
* Components use Auto Layout.
* Reusable components use variants.
* Semantic naming is consistent.
* No obvious duplicated components.

## Mobile

* 360 px works.
* Touch targets remain usable.
* No horizontal overflow.
* Image content remains readable.
* Core actions remain reachable.

## Product identity

* Feels like Cutback.
* Premium modern barbershop character is recognizable.
* Does not look like generic AI SaaS.
* Does not rely on gold to appear premium.
* Photography remains dominant.

## Handoff

* Developer can identify reusable components.
* States are visible.
* Responsive behavior is documented.
* Open design decisions are documented.
* Important requirement relationships are traceable.

---

# 30. FINAL OUTPUT

The final Figma file should provide:

### Design Foundations

Reusable visual tokens.

### Component Library

Reusable components with variants.

### Pattern Library

Reusable interaction/layout patterns.

### Representative Screens

Enough to prove the system.

### States

Happy and failure paths.

### Responsive Guidance

Mobile-first plus large-screen adaptation.

### Handoff Documentation

Enough context for a developer or coding agent to implement without guessing.

Do not optimize for:

> “How many screens can we produce?”

Optimize for:

> **“How reliably can this design system generate the rest of Cutback?”**

The goal is not maximum visual output.

The goal is a **scalable, implementation-ready Cutback design system**.
