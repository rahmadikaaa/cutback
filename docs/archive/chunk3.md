Continue from the approved Cutback Foundations and Component Library.

Your task is to build reusable product patterns in:

`03 — Patterns`

Do not create every final screen yet.

Use existing components.

Do not create new one-off components unless the existing system genuinely cannot represent the required pattern.

## Core Product Journey

Cutback follows:

Upload
→ Validate
→ Analyze
→ Recommend
→ Choose
→ Preview
→ Barber Brief
→ Save
→ Reopen

Preferences are optional.

Preview is generated only for the haircut selected by the user.

## Pattern 1 — Upload

Create a reusable upload pattern supporting:

* Choose from gallery
* Take a photo where supported
* File upload fallback
* Local preview
* Replace photo
* Consent
* Validation guidance
* Validation error

Photo guidance:

* one person
* face visible
* hair visible
* enough lighting

Avoid overwhelming instruction copy.

## Pattern 2 — Analysis State

Create patterns for:

* analyzing
* slower-than-expected
* failed
* offline
* retry

Do not use:

* fake percentages
* AI scanning HUDs
* glowing face maps
* generic AI sparkles

## Pattern 3 — Optional Preferences

Support:

* vibe
* desired length
* styling effort
* optional notes

Preferences must clearly feel optional.

Do not turn this into a long onboarding form.

## Pattern 4 — Recommendation

Locked hierarchy:

### 1 Primary recommendation

Editorially dominant.

### 2 Alternatives

Clearly secondary.

Primary recommendation should communicate:

* haircut name
* image
* why it fits
* styling effort
* length
* trade-offs / constraints

Selection state must be unmistakable.

## Pattern 5 — Preview

Preview only happens after explicit haircut selection.

If DESIGN.md has already selected a comparison pattern, follow it.

If still open, compare:

* swipe comparison
* toggle
* press-and-hold
* stacked comparison
* side-by-side

Select based on:

* 360 px usability
* accessibility
* discoverability
* ability to inspect hair
* implementation feasibility

Include:

* original label
* AI simulation label
* selected haircut
* loading
* failure
* retry
* disclaimer

## Pattern 6 — Barber Brief

Direction:

**Luxury Barber Consultation Card**

Prioritize scanability over decoration.

A barber should understand the brief in seconds.

Use:

* clear title
* reference imagery
* haircut details
* notes
* unknown/confirm-with-barber treatment

## Pattern 7 — Saved Haircuts

Use clear terminology:

**My Haircuts**

Visual treatment may feel like a personal grooming archive.

Support:

* name
* date
* primary image
* reopen brief

## Pattern 8 — Navigation

Use hybrid adaptive navigation.

Core journey:

* contextual
* focused
* immersive

Persistent areas:

* conventional app navigation where justified

Do not force navigation to remain fixed globally.

## Output

Build only reusable patterns.

Each pattern should demonstrate:

* normal
* relevant alternate state
* mobile resizing behavior

Do not yet build the polished final screen set.
