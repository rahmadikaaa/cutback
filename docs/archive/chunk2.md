Continue from the approved Cutback Figma Foundations.

Do not change established foundations unless a clear usability or accessibility problem is discovered.

Your task is now to create:

`02 — Components`

The objective is a reusable component library suitable for developer handoff.

Use:

* Figma Variables
* Auto Layout
* component variants
* component properties
* semantic naming

Avoid duplicated standalone components.

## Build These Components

### Buttons

Create:

* Primary
* Secondary
* Tertiary
* Destructive
* Icon button only where justified

States:

* Default
* Hover where relevant
* Pressed
* Focus
* Loading
* Disabled

Important mobile touch target:
**minimum 44 × 44 CSS px equivalent**

### Inputs

Create:

* Text Input
* Textarea
* Upload Control
* Preference Selector
* Validation Message

States:

* Default
* Focus
* Filled
* Error
* Disabled

Ensure virtual-keyboard-friendly layouts.

### Navigation

Create two distinct navigation patterns:

#### Navigation/CoreHeader

For immersive core journey.

Should support:

* contextual back
* optional progress
* minimal chrome

#### Navigation/App

For persistent areas such as My Haircuts.

Do not force persistent bottom navigation into the main journey.

### Photo Components

Create:

* Photo/User
* Photo/Hero
* Photo/Recommendation
* Photo/Preview
* Photo/Reference
* Photo/Thumbnail

Include:

* loading
* failed/unavailable
* labels where required

Document aspect-ratio rules.

### Recommendation Components

Create:

`Recommendation/Primary`

for the editorial Best Match.

Create:

`Recommendation/Alternative`

for two secondary choices.

States:

* default
* selected
* pressed/interactive

Do not use fake confidence percentages.

### Status Components

Create reusable:

* Loading
* Error
* Offline
* Warning
* Success
* Empty

### Barber Brief Components

Create reusable:

* BarberBrief/Header
* BarberBrief/DetailRow
* BarberBrief/Section
* BarberBrief/UnknownValue
* BarberBrief/ImageReference

Fields may include:

* top
* sides
* back
* fade/taper
* texture
* styling
* notes

### Saved Haircut Components

Create:

* SavedHaircut/Item
* SavedHaircut/Hero
* SavedHaircut/Metadata

Support clear reopen actions.

## Component Rules

All normal UI components should use Auto Layout.

Use:

* Fill container
* Hug contents
* fixed dimensions only where justified

Use component properties instead of copies where possible.

Use clear naming.

Good:
`Button/Primary`

Bad:
`Button Final 2`

## Documentation

For every major component document:

* Purpose
* Usage
* Variants
* Content behavior
* Responsive behavior
* Accessibility
* Do / Don't

## Output

Complete:

`02 — Components`

Do not create full screens yet.

Before finishing, perform a duplication audit:

* duplicate button styles?
* duplicated typography?
* one-off spacing?
* detached component variants?
* unnecessary card variants?

Fix those before moving on.
