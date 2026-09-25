# Cutback — Session Report

**Date:** 22 September 2026  
**Status:** Working checkpoint  
**Focus:** UX direction, Transformation Journey, Graphify role, and Hair Knowledge MVP

## 1. Main Direction

Cutback is being shaped as more than a haircut recommendation UI.

Core experience direction:

> **Cutback turns haircut discovery into a personal transformation journey — from seeing what’s possible, to making it real, to remembering what worked.**

The design should keep the current premium dark/navy visual language, while strengthening the product narrative and transformation experience.

## 2. Homepage / Hero Direction

Current homepage visual direction is considered strong and should be kept.

Planned narrative update:
- Headline direction: **Transformation Journey**
- Primary CTA direction: **Make It Real**
- Keep portrait as dominant visual anchor
- Use hairstyle transformation motion as the signature homepage experience

Core motion principle:

> **Identity stays. Hair transforms.**

The homepage motion should:
- Keep the same person, face, pose, clothing, lighting, framing, and background
- Change only the hairstyle
- Feel premium and smooth, not sudden or creepy
- Avoid unnecessary camera/body movement
- Communicate the product promise before the user starts the real flow

## 3. Transformation Journey

Two separate transformation experiences were discussed:

### A. Homepage Transformation
Purpose: communicate what Cutback can do.

- Uses prepared/pregenerated assets
- No live AI generation on every homepage visit
- Fast, predictable, and cost-efficient
- Motion is part of the brand experience

### B. Personal Transformation
Purpose: let the user experience the same idea on themselves.

Flow direction:

**Selfie → Analysis → Knowledge Matching → Recommendations → Preview on Demand → Cache → Barber Brief → Save / Repeat**

## 4. Graphify Direction

The intended role of Graphify is not to become the visual generation model.

The working concept is:

1. User uploads selfie
2. Visual analysis produces structured user/hair profile data
3. Graphify / knowledge layer is used around structured haircut knowledge and relationships
4. Matching/recommendation logic uses that knowledge
5. Recommendations are shown to the user
6. Personal preview is generated only when the user wants to try a specific hairstyle
7. Successful previews are cached and reused

Working principle:

> **Analyze once, recommend from knowledge, preview on demand, generate once, cache.**

## 5. Hair Knowledge Strategy

Instead of storing thousands of generated hairstyle images, Cutback should start by storing structured hairstyle knowledge / “recipes”.

Possible fields per hairstyle:
- Hairstyle ID
- Name
- Family/category
- Top length
- Side length
- Back length
- Fade/taper type
- Volume
- Texture
- Styling direction
- Styling effort
- Minimum hair requirements
- Constraints
- Visual effect / silhouette
- Barber language
- Related hairstyles
- Compatible variations
- Evidence/source metadata
- Confidence / verification status where relevant

The exact schema still needs to be defined.

## 6. MVP Data Scope

Do **not** start with hundreds or thousands of hairstyles.

Start with approximately **5 hairstyles** and make the data deep and consistent.

Suggested initial candidates:
- Textured Quiff
- Low Taper + Volume
- Side Part
- French Crop
- Slick Back

These are still candidates, not a locked final dataset.

Goal of v0.1:
- Prove the knowledge structure works
- Prove Graphify relationships are useful
- Prove recommendation reasoning can be explained
- Prove preview and barber brief can use the same hairstyle recipe consistently

Only after that should the dataset scale toward tens, hundreds, or thousands of hairstyles.

## 7. UX Decision: Recommendation + Preview

The preferred direction is that recommendation and preview feel connected, not like separate disconnected pages.

Possible experience:
- Best Match is active first
- User sees why it is recommended
- User can tap another recommended style
- Personal preview is generated on demand for the selected style
- Generated preview is cached
- Returning to the same hairstyle should reuse the cached result

This preserves the feeling of “trying hairstyles” while controlling generation cost.

## 8. Cost / Efficiency Principle

Avoid generating personal images for every recommendation automatically.

Preferred strategy:
- Analyze selfie once
- Generate recommendation from structured knowledge
- Generate personal preview only after explicit user interest
- Cache valid previews
- Reuse cached results
- Homepage uses prepared assets instead of live generation

## 9. Current Design Position

Do not redesign the whole app from scratch.

Keep:
- Dark/navy palette
- Premium editorial feeling
- Large portrait
- Minimal interface chrome
- Mobile-first direction

Improve:
- Narrative continuity
- Signature transformation motion
- Recommendation-to-preview experience
- “Make It Real” progression
- Connection from transformation to Barber Brief and saved haircut

## 10. Immediate Next Session

When the laptop is opened, start here:

### Step 1 — Create `Cutback Hair Knowledge v0.1`

Define the schema for one hairstyle first.

### Step 2 — Fill 5 hairstyle records

Use the same schema for all 5.

### Step 3 — Prepare Graphify-friendly data

Choose a structured format such as:
- Markdown
- YAML
- JSON

### Step 4 — Ingest and inspect

Check whether:
- concepts are mapped correctly
- relationships are useful
- duplicate/ambiguous concepts appear
- recommendation reasoning can be traced

### Step 5 — Test one small end-to-end flow

**Selfie → analysis → matching → recommendation → preview on demand → cache → barber brief**

Do not scale the dataset until this small loop feels correct.

## 11. Current Checkpoint

The next priority is **not**:
- adding more UI screens
- collecting thousands of hairstyle names
- generating many preview images
- doing a large GCP integration immediately

The next priority is:

> **Prove the Cutback Hair Knowledge model with a tiny but complete dataset.**

Once that works, the knowledge base, UX, AI integration, and scale strategy can grow from the same foundation.
