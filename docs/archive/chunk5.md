Finalize the Cutback Figma system for implementation handoff.

Use the existing approved:

* Foundations
* Components
* Patterns
* Mobile Screens

Now create:

`05 — Responsive`
`06 — States`
`07 — Handoff`

## Responsive

Demonstrate behavior for:

* 360 px
* 390 px
* 430 px
* tablet
* desktop

Desktop must not become a dashboard.

Show representative responsive behavior for:

* Landing
* Recommendations
* Barber Brief or My Haircuts

Define:

* max content width
* image scaling
* split-layout conditions
* mobile-to-desktop navigation changes
* text wrapping
* component resizing

## States

Create representative states for:

* photo invalid
* analysis loading
* analysis failure
* offline
* recommendation selected
* preview loading
* preview failure
* save success
* My Haircuts empty

Prefer component variants over duplicate full screens.

## Mobile Reality

Validate:

* 360 px no horizontal scroll
* 44 × 44 touch targets
* safe areas
* virtual keyboard
* long textarea
* long Barber Brief
* image inspection
* browser viewport behavior

## Handoff Documentation

For important components/patterns document:

### Purpose

Why the component exists.

### Usage

When to use.

### Do not use

When another pattern is preferred.

### Variants

Available states.

### Responsive behavior

How it changes.

### Content behavior

Long copy, empty values, unknown values.

### Accessibility

Contrast, focus, touch target, status messaging.

## Developer Mapping

Prepare variables so they can map cleanly to:

* CSS custom properties
* Tailwind tokens
* design-token JSON

Prefer semantic names.

Add concise requirement-ID annotations where helpful.

## Final Audit

Run these checks:

### System quality

* colors are variables
* text uses defined styles
* spacing follows scale
* components use Auto Layout
* variants replace duplicates
* naming is semantic

### Product quality

* recommendation feels curated
* preview is understandable
* Barber Brief is practical
* Saved Haircuts feels meaningful
* dark hair remains visible
* gold is restrained

### Mobile quality

* 360 px passes
* no horizontal overflow
* touch targets pass
* keyboard does not block critical actions

### Handoff quality

Ask:

> Could a frontend developer implement this without guessing?

If no, improve documentation.

## Final Deliverable

The final Figma file should contain:

* 00 — Cover
* 01 — Foundations
* 02 — Components
* 03 — Patterns
* 04 — Mobile Screens
* 05 — Responsive
* 06 — States
* 07 — Handoff

Do not produce more screens unless they materially improve system validation.

Optimize for:

**scalability, consistency, and implementation handoff.**
