# Cutback — Design Guidelines

## Stance
**Warm editorial on dark navy.** Premium, masculine without aggression. Image-led — the user's portrait is always the hero. AI is a tool, not the spectacle.

## Color Tokens
| Token | Value | Role |
|---|---|---|
| `--background` | `#080c14` | Page / screen ground |
| `--foreground` | `#f0ebe0` | Primary text (warm off-white) |
| `--card` | `#0f1520` | Card / panel surfaces |
| `--secondary` | `#161d2c` | Raised surfaces, inputs |
| `--primary` | `#c9a96e` | Warm gold — CTAs, labels, accents |
| `--primary-foreground` | `#080c14` | Text on gold CTAs |
| `--muted-foreground` | `#8a8278` | Secondary text, captions |
| `--secondary-foreground` | `#c0b8a8` | Supporting text |
| `--border` | `rgba(240,235,224,0.08)` | Hairline dividers |

**Error:** `#e57373` **Success:** implied by gold check marks

## Typography
- **Display:** DM Serif Display — hero hairstyle names, screen headings, brand moments
- **Body:** DM Sans — all UI text, labels, body copy
- Hierarchy: 52px display / 32px screen title / 24px section / 16px body / 12px label / 9–10px uppercase micro

## Motion Grammar (from design spec v1.2)
1. **ANCHOR** — user portrait stays fixed; surrounding information evolves around it
2. **TRANSFORM** — hairstyle/hair is the primary changing variable; identity is stable
3. **CONVERGE** — observed data + intent → grounded recommendation
4. **RESOLVE** — multiple possibilities narrow to one chosen direction

**Implementation:** opacity crossfade (650ms ease) for portrait toggle; `recFade` keyframe (200ms) for recommendation text transitions; `sheetUp` (320ms) for bottom sheets.

## Layout Principles
- Mobile-first: 390px primary, 360px minimum — no horizontal overflow
- Portrait images: `object-cover object-top` to lock face in frame
- Gradient overlays on portraits: dark-to-transparent at bottom for legible text
- 44px minimum touch targets on all interactive controls
- Primary CTAs: `minHeight: 56px`, full-width, rounded-xl
- Ghost/secondary CTAs: `minHeight: 48px`, border + secondary background

## Screen Structure Pattern
```
[Portrait anchor — 44–62% of viewport height]
  [gradient overlay — dark at bottom]
  [nav: back button + status]
  [content overlay at bottom]
[Scrollable info panel]
  [content cards / rows]
  [primary CTA at bottom]
```

## Simulated / AI Labels
Every AI-generated screen must show a `SimBadge` component:
- Analysis: "Simulated AI Analysis"
- Preview: "Generating AI Preview" / "AI Simulation"
- Upload: "Simulated Upload"
- Save: "Simulated Save"

## AI Preview & Personal Flow Architecture
- **State Machine Integration:**
  1. `POST /api/upload` — uploads user photo and receives `revisionId`.
  2. `POST /api/analyze` — evaluates facial geometry & hair properties.
  3. `POST /api/recommendations` — generates recommendations matching facial attributes and preferences.
  4. `POST /api/select` — commits selected haircut (`revisionId`, `hairstyleId`), transitioning state to `READY_FOR_PREVIEW`.
  5. `POST /api/preview` — calls image generation model (`googleai/gemini-3.1-flash-image`) using original photo + chosen style.
- **Personal Flow Integrity:**
  - In personal preview and Barber Brief, static fallback dummy portraits (`portrait-2.png`) are omitted in favor of the real AI-generated preview image or clear no-preview indicators.
  - Race conditions prevented via cancellation guards on unmount/re-select.
  - Clear error recovery: Retry or continue without preview to Barber Brief.

## Accessibility Floor
- All body text ≥ 4.5:1 contrast (warm off-white on dark navy satisfies this)
- Non-color-only error indicators: `⚠` icon + text + red border
- `prefers-reduced-motion`: all transitions set to 0ms in CSS
- Semantic `aria-label` on all icon-only buttons
- Consent checkbox never pre-checked

