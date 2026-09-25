You are building the Figma design foundation for **Cutback**, a mobile-first AI haircut companion.

Read the latest:

1. Cutback Requirements
2. Cutback PRD
3. Cutback DESIGN.md

Priority:
**Requirements → PRD → DESIGN.md**

Do not redesign product behavior.
Do not add features.
Do not create full product screens yet.

Your task in this phase is only to establish the reusable visual foundation.

## Product Direction

Cutback is a mobile-first web app.

Primary widths:

* 360 px
* 390 px
* 430 px

Art direction:

**Dark Premium Barbershop**

Use:

* deep navy
* charcoal / near-black
* warm ivory
* restrained brass or muted gold
* editorial haircut photography
* strong negative space
* premium modern grooming character

Influence strength:
**Balanced**

Dominant character:
**premium modern barbershop**

Secondary inspiration may come from:

* bespoke tailoring
* editorial menswear
* restrained Art Deco geometry
* premium grooming packaging

Avoid:

* Gatsby cosplay
* whiskey/cigar-club styling
* generic black-and-gold luxury
* generic AI SaaS
* gradients
* glassmorphism
* excessive rounded cards

## Create Figma Foundations

Create a dedicated `01 — Foundations` section/page.

Define:

### Color variables

Use semantic names such as:

* bg/canvas
* bg/surface
* bg/elevated
* text/primary
* text/secondary
* text/muted
* border/default
* border/subtle
* accent/primary
* interactive/default
* interactive/disabled
* status/success
* status/warning
* status/error
* selection/active

Provide actual values.

Do not use gold as normal body text.

Ensure dark hair remains distinguishable from dark surfaces.

### Typography

Create a paired system:

**Editorial display**
for controlled brand and recommendation moments.

**Functional sans-serif**
for:

* controls
* instructions
* navigation
* Barber Brief
* form content
* status messages

Define:

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

Specify:

* font family
* size
* weight
* line height
* letter spacing
* usage

### Spacing

Create a reusable spacing scale.

Prefer a coherent system such as:

4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64

Adjust only if DESIGN.md justifies it.

### Radius

Define:

* small
* medium
* large
* full only when necessary

Avoid excessive roundness.

### Borders / dividers

Use restrained editorial rules and subtle outlines.

### Elevation

Use sparingly.

Premium should come primarily from:

* composition
* imagery
* spacing
* typography

not shadows.

### Layout

Primary mobile frame:
**390 px**

Also define behavior for:

* 360 px
* 430 px

Determine:

* side padding
* content width
* vertical rhythm
* safe-area spacing
* image behavior
* full-bleed behavior

## Scalability Requirement

All choices must be reusable.

Avoid:

* arbitrary one-off values
* hardcoded colors
* manually repeated styles

The system should map cleanly later to:

* CSS variables
* Tailwind tokens
* design-token JSON

## Output

Complete only:

`01 — Foundations`

Document major usage rules next to the tokens.

Do not create the full component library yet.

At the end, summarize:

1. foundation decisions
2. unresolved issues
3. accessibility risks
4. anything requiring validation before component creation
