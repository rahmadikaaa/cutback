import { Request, Response } from 'express';
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { z } from 'zod';
import { revisions } from './state';
import { saveRevision, getOrHydrateRevision } from './firestoreDb';
import crypto from 'crypto';

export const EvidenceSourceSchema = z.enum(['Observed', 'Inferred', 'User-provided', 'Unknown']);

export const ReasonEvidenceItemSchema = z.object({
  attribute: z.string(),
  value: z.string(),
  source: EvidenceSourceSchema,
  contribution: z.string()
});

export const RecommendationSchema = z.object({
  recommendations: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    reason: z.string(),
    reasonEvidence: z.array(ReasonEvidenceItemSchema).optional(),
    stylingEffort: z.enum(['low', 'medium', 'high']),
    constraints: z.array(z.string()),
    isBestMatch: z.boolean(),
    bestMatchReason: z.string().optional(),
    feasibility: z.enum([
      'Ready Now',
      'Possible with Adjustment',
      'Transition Required',
      'Not Currently Realistic'
    ]).optional(),
    transitionGuidance: z.string().optional(),
    barberBrief: z.object({
      top: z.string().optional(),
      sides: z.string().optional(),
      back: z.string().optional(),
      fringe: z.string().optional(),
      styling: z.string().optional(),
      maintenance: z.string().optional(),
      preserve: z.string().optional(),
      avoid: z.string().optional()
    }).optional()
  })).max(3)
});

export function cleanCanonicalHaircutName(name: string, userNote?: string): string {
  if (!name) return name;
  let cleaned = name.trim();

  // 1. Remove user note in parentheses or with hyphen/colon if matching userNote
  if (userNote && userNote.trim()) {
    const rawNote = userNote.trim();
    const escaped = rawNote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`\\s*(?:[(-/:]\\s*)*\\b${escaped}\\b\\s*[)]?`, 'gi'), '').trim();
  }

  // 2. Remove common informal aliases/notes in parentheses such as (Cepak), (buzz cut), (pendek), etc.
  cleaned = cleaned.replace(/\s*\((?:cepak|buzz\s*cut|pendek|rapirapi|spiky|undercut|fade|taper|side\s*part|quiff)\)/gi, '').trim();

  // 3. Remove trailing dangling punctuation or parens
  cleaned = cleaned.replace(/[\s\-_:/(]+$/, '').trim();

  return cleaned || name.trim();
}

export function validateAndAlignEvidence(
  recommendations: Array<{
    id: string;
    name: string;
    description: string;
    reason: string;
    reasonEvidence?: Array<{
      attribute: string;
      value: string;
      source: 'Observed' | 'Inferred' | 'User-provided' | 'Unknown';
      contribution: string;
    }>;
    stylingEffort: 'low' | 'medium' | 'high';
    constraints: string[];
    isBestMatch: boolean;
    bestMatchReason?: string;
    feasibility?: 'Ready Now' | 'Possible with Adjustment' | 'Transition Required' | 'Not Currently Realistic';
    transitionGuidance?: string;
    barberBrief?: any;
  }>,
  analysis?: any,
  preferences?: any
): void {
  if (!recommendations || recommendations.length === 0) return;

  const analysisAttrs = analysis?.attributes || {};

  const getAnalysisAttr = (key: string) => {
    const raw = analysisAttrs[key];
    if (!raw) return { value: 'unknown', source: 'Unknown' as const };
    const val = typeof raw === 'string' ? raw : (raw.value || 'unknown');
    const src = (typeof raw === 'object' && raw.source) ? raw.source : 'Unknown';
    return { value: val.toLowerCase(), source: src as 'Observed' | 'Inferred' | 'User-provided' | 'Unknown' };
  };

  const faceShape = getAnalysisAttr('faceShape');
  const hairType = getAnalysisAttr('hairType');
  const hairLength = getAnalysisAttr('hairLength');
  const hairThickness = getAnalysisAttr('hairThickness');
  const hairLine = getAnalysisAttr('hairLine');

  for (const rec of recommendations) {
    // 1. Sanitize canonical haircut name: strip user notes/slang like "(Cepak)"
    rec.name = cleanCanonicalHaircutName(rec.name, preferences?.note);

    // 2. Ground and align reasonEvidence
    const rawEvidence = Array.isArray(rec.reasonEvidence) ? rec.reasonEvidence : [];
    const alignedEvidence: Array<{
      attribute: string;
      value: string;
      source: 'Observed' | 'Inferred' | 'User-provided' | 'Unknown';
      contribution: string;
    }> = [];

    const seenAttributes = new Set<string>();

    for (const item of rawEvidence) {
      if (!item || !item.attribute) continue;
      const attrLower = item.attribute.toLowerCase();
      let matchedSource: 'Observed' | 'Inferred' | 'User-provided' | 'Unknown' = item.source || 'Unknown';
      let normalizedAttr = item.attribute;
      let normalizedVal = item.value;
      let contribution = item.contribution || '';

      if (attrLower.includes('face') || attrLower.includes('shape')) {
        normalizedAttr = 'Face Shape';
        matchedSource = faceShape.source;
        if (faceShape.value !== 'unknown') {
          normalizedVal = faceShape.value.charAt(0).toUpperCase() + faceShape.value.slice(1);
        }
        if (matchedSource === 'Inferred' && !contribution.toLowerCase().includes('likely') && !contribution.toLowerCase().includes('appears')) {
          contribution = `Likely ${normalizedVal.toLowerCase()} face shape framed by this cut`;
        }
      } else if (attrLower.includes('pattern') || attrLower.includes('type') || attrLower.includes('wave') || attrLower.includes('straight') || attrLower.includes('curl')) {
        normalizedAttr = 'Hair Pattern';
        matchedSource = hairType.source;
        if (hairType.value !== 'unknown') {
          normalizedVal = hairType.value.charAt(0).toUpperCase() + hairType.value.slice(1);
        }
      } else if (attrLower.includes('length')) {
        normalizedAttr = 'Hair Length';
        matchedSource = hairLength.source;
        if (hairLength.value !== 'unknown') {
          normalizedVal = hairLength.value.charAt(0).toUpperCase() + hairLength.value.slice(1);
        }
      } else if (attrLower.includes('thickness') || attrLower.includes('density')) {
        normalizedAttr = 'Hair Thickness';
        matchedSource = hairThickness.source;
        if (hairThickness.value === 'unknown') {
          matchedSource = 'Unknown';
          normalizedVal = 'Unknown';
          contribution = 'Hair density not clearly determined from photo — confirm with barber';
        } else {
          normalizedVal = hairThickness.value.charAt(0).toUpperCase() + hairThickness.value.slice(1);
          if (matchedSource === 'Inferred' && !contribution.toLowerCase().includes('likely') && !contribution.toLowerCase().includes('appears')) {
            contribution = `Appears to have ${normalizedVal.toLowerCase()} hair density`;
          }
        }
      } else if (attrLower.includes('hairline') || attrLower.includes('line')) {
        normalizedAttr = 'Hairline';
        matchedSource = hairLine.source;
        if (hairLine.value !== 'unknown') {
          normalizedVal = hairLine.value.charAt(0).toUpperCase() + hairLine.value.slice(1);
        }
      } else if (attrLower.includes('note') || attrLower.includes('preference') || attrLower.includes('user') || (preferences?.note && item.value?.toLowerCase().includes(preferences.note.toLowerCase()))) {
        normalizedAttr = 'User Preference';
        matchedSource = 'User-provided';
        if (preferences?.note) {
          normalizedVal = preferences.note;
        }
        contribution = contribution || `User requested "${normalizedVal}" styling preference`;
      }

      // Check for unsupported model claims on unknown attributes
      if (normalizedAttr === 'Hair Thickness' && hairThickness.value === 'unknown') {
        matchedSource = 'Unknown';
        normalizedVal = 'Unknown';
        contribution = 'Hair density not clearly determined from photo — confirm with barber';
      }

      if (!seenAttributes.has(normalizedAttr)) {
        seenAttributes.add(normalizedAttr);
        alignedEvidence.push({
          attribute: normalizedAttr,
          value: normalizedVal,
          source: matchedSource,
          contribution: contribution.trim()
        });
      }
    }

    // Baseline grounded evidence if empty
    if (alignedEvidence.length === 0) {
      if (faceShape.value !== 'unknown') {
        const valCap = faceShape.value.charAt(0).toUpperCase() + faceShape.value.slice(1);
        alignedEvidence.push({
          attribute: 'Face Shape',
          value: valCap,
          source: faceShape.source,
          contribution: faceShape.source === 'Inferred'
            ? `Likely ${faceShape.value} proportions naturally framed by this cut`
            : `${valCap} proportions naturally framed by this cut`
        });
        seenAttributes.add('Face Shape');
      }

      if (hairType.value !== 'unknown') {
        const valCap = hairType.value.charAt(0).toUpperCase() + hairType.value.slice(1);
        alignedEvidence.push({
          attribute: 'Hair Pattern',
          value: valCap,
          source: hairType.source,
          contribution: hairType.source === 'Inferred'
            ? `Appears to work with natural ${hairType.value} movement`
            : `Works with natural ${hairType.value} movement`
        });
        seenAttributes.add('Hair Pattern');
      }

      if (hairLength.value !== 'unknown') {
        const valCap = hairLength.value.charAt(0).toUpperCase() + hairLength.value.slice(1);
        alignedEvidence.push({
          attribute: 'Hair Length',
          value: valCap,
          source: hairLength.source,
          contribution: `Current ${hairLength.value} length provides viable base for this style`
        });
        seenAttributes.add('Hair Length');
      }
    }

    // Include User Preference if provided in input
    if (preferences?.note && preferences.note.trim() && !seenAttributes.has('User Preference')) {
      alignedEvidence.push({
        attribute: 'User Preference',
        value: preferences.note.trim(),
        source: 'User-provided',
        contribution: `Personal preference for "${preferences.note.trim()}" influences style direction without altering photo findings`
      });
      seenAttributes.add('User Preference');
    }

    rec.reasonEvidence = alignedEvidence;

    // 3. Ensure barberBrief does not contradict analysis
    if (rec.barberBrief) {
      if (hairThickness.value === 'unknown') {
        if (rec.barberBrief.styling && rec.barberBrief.styling.toLowerCase().includes('thick hair')) {
          rec.barberBrief.styling = rec.barberBrief.styling.replace(/thick hair/gi, 'hair density (confirm with barber)');
        }
        if (rec.barberBrief.maintenance && rec.barberBrief.maintenance.toLowerCase().includes('thick hair')) {
          rec.barberBrief.maintenance = rec.barberBrief.maintenance.replace(/thick hair/gi, 'hair density (confirm with barber)');
        }
      }
    }
  }
}

const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

export function resolveBestMatch(recommendations: Array<{
  id: string;
  name: string;
  description: string;
  reason: string;
  stylingEffort: 'low' | 'medium' | 'high';
  constraints: string[];
  isBestMatch: boolean;
  bestMatchReason?: string;
  feasibility?: 'Ready Now' | 'Possible with Adjustment' | 'Transition Required' | 'Not Currently Realistic';
  transitionGuidance?: string;
  barberBrief?: any;
}>): void {
  if (!recommendations || recommendations.length === 0) return;

  const feasibilityRank: Record<string, number> = {
    'Ready Now': 1,
    'Possible with Adjustment': 2,
    'Transition Required': 3,
    'Not Currently Realistic': 4,
  };

  const bestMatches = recommendations.filter(r => r.isBestMatch);

  // If AI produced exactly 1 Best Match, verify if it's 'Not Currently Realistic' while realistic alternatives exist
  if (bestMatches.length === 1) {
    const singleMatch = bestMatches[0];
    const hasRealisticAlternative = recommendations.some(
      r => r !== singleMatch && (r.feasibility === 'Ready Now' || r.feasibility === 'Possible with Adjustment')
    );

    if (singleMatch.feasibility === 'Not Currently Realistic' && hasRealisticAlternative) {
      // Demote unrealistic match and pick the most realistic alternative
      recommendations.forEach(r => { r.isBestMatch = false; });
      const bestAlternative = [...recommendations].sort((a, b) => {
        const rankA = a.feasibility ? (feasibilityRank[a.feasibility] ?? 5) : 5;
        const rankB = b.feasibility ? (feasibilityRank[b.feasibility] ?? 5) : 5;
        return rankA - rankB;
      })[0];

      bestAlternative.isBestMatch = true;
      bestAlternative.bestMatchReason = `Best match selected based on feasibility (${bestAlternative.feasibility || 'Realistic'}).`;
      return;
    }

    // Single match is acceptable, ensure it has a reason
    if (!singleMatch.bestMatchReason) {
      singleMatch.bestMatchReason = singleMatch.feasibility
        ? `Best match selected: ${singleMatch.feasibility}.`
        : 'Best match selected for your profile.';
    }
    return;
  }

  // If AI produced 0 or multiple Best Matches, resolve deterministically using feasibility ranking
  recommendations.forEach(r => { r.isBestMatch = false; });

  const sortedCandidates = [...recommendations].sort((a, b) => {
    const rankA = a.feasibility ? (feasibilityRank[a.feasibility] ?? 5) : 5;
    const rankB = b.feasibility ? (feasibilityRank[b.feasibility] ?? 5) : 5;
    return rankA - rankB;
  });

  const chosen = sortedCandidates[0];
  chosen.isBestMatch = true;
  if (!chosen.bestMatchReason || chosen.bestMatchReason === 'Fallback best match.') {
    if (chosen.feasibility) {
      chosen.bestMatchReason = `Best match selected based on feasibility: ${chosen.feasibility}.`;
    } else {
      chosen.bestMatchReason = 'Best match selected based on feature alignment.';
    }
  }
}

export function arePreferencesEqual(
  a?: { vibe?: string; desiredLength?: string; stylingEffort?: string; note?: string },
  b?: { vibe?: string; desiredLength?: string; stylingEffort?: string; note?: string }
): boolean {
  const normA = {
    vibe: (a?.vibe || '').trim(),
    desiredLength: (a?.desiredLength || '').trim(),
    stylingEffort: (a?.stylingEffort || '').trim(),
    note: (a?.note || '').trim(),
  };
  const normB = {
    vibe: (b?.vibe || '').trim(),
    desiredLength: (b?.desiredLength || '').trim(),
    stylingEffort: (b?.stylingEffort || '').trim(),
    note: (b?.note || '').trim(),
  };
  return (
    normA.vibe === normB.vibe &&
    normA.desiredLength === normB.desiredLength &&
    normA.stylingEffort === normB.stylingEffort &&
    normA.note === normB.note
  );
}

export const recommendationFlow = ai.defineFlow({
  name: 'recommendationFlow',
  inputSchema: z.object({
    revisionId: z.string(),
    preferences: z.object({
      vibe: z.string().optional(),
      desiredLength: z.string().optional(),
      stylingEffort: z.string().optional(),
      note: z.string().max(500).optional()
    }).optional()
  }),
  outputSchema: z.object({
    route: z.enum(['SUCCESS', 'STALE', 'RETRY_REQUIRED']),
    recommendations: RecommendationSchema.optional(),
    message: z.string()
  })
}, async (input) => {
  const state = await getOrHydrateRevision(input.revisionId);
  
  if (!state) {
    return { route: 'STALE' as const, message: 'Revision not found.' };
  }
  
  if (state.status !== 'ANALYZED' && state.status !== 'RECOMMENDATIONS_READY' && state.status !== 'READY_FOR_PREVIEW') {
    return { route: 'STALE' as const, message: `Cannot generate recommendations in state: ${state.status}` };
  }

  if (!state.analysis) {
    return { route: 'STALE' as const, message: 'Missing analysis.' };
  }

  // 1. In-flight promise guard: reuse in-flight execution if incoming preferences match
  while (state.recommendationPromise) {
    if (arePreferencesEqual(state.recommendationPromisePreferences, input.preferences)) {
      return await state.recommendationPromise;
    }
    // If incoming preferences differ, await the current in-flight generation to settle
    try {
      await state.recommendationPromise;
    } catch {
      // Ignore errors from preceding request; proceed with new preferences
    }
  }

  // 2. Safe reuse of completed recommendations for identical preferences
  if (
    (state.status === 'RECOMMENDATIONS_READY' || state.status === 'READY_FOR_PREVIEW') &&
    state.recommendations &&
    state.recommendations.length > 0 &&
    arePreferencesEqual(state.preferences, input.preferences)
  ) {
    return {
      route: 'SUCCESS' as const,
      recommendations: { recommendations: state.recommendations },
      message: 'Recommendations already generated.'
    };
  }

  state.recommendationPromisePreferences = input.preferences ? { ...input.preferences } : undefined;

  state.recommendationPromise = (async () => {
    try {
      const promptParams = {
        analysis: state.analysis,
        preferences: input.preferences
      };

      const { output } = await ai.generate({
        model: 'googleai/gemini-3.5-flash',
        prompt: `Generate up to 3 distinct hairstyle recommendations based on this analysis and user preferences.
      
      Analysis: ${JSON.stringify(promptParams.analysis)}
      Preferences: ${JSON.stringify(promptParams.preferences || {})}

      CRITICAL INSTRUCTIONS:
      1. Strictly adhere to the requested JSON schema.
      2. Provide up to 3 distinct recommendations.
      3. Exactly one recommendation should have isBestMatch = true with a bestMatchReason. Prioritize realistic options ('Ready Now' or 'Possible with Adjustment') over unrealistic ones ('Not Currently Realistic') unless no realistic alternative exists.
      4. Professional Canonical Names: Hairstyle names MUST be standard industry names (e.g. 'Classic Crew Cut', 'Textured Quiff', 'Side Part', 'French Crop'). NEVER append user notes, slang, or parentheticals to the hairstyle name (e.g. NEVER output 'Classic Crew Cut (Cepak)' or 'Crew Cut (cepak)' - output 'Classic Crew Cut').
      5. Structured Reason Evidence: Populate structured reasonEvidence items for each recommendation grounded directly in the supplied analysis and user preferences:
         - attribute: 'Face Shape', 'Hair Pattern', 'Hair Length', 'Hair Thickness', 'Hairline', or 'User Note'
         - value: standard attribute value (e.g. 'Oval', 'Straight', 'Short', 'Thick', 'Cepak')
         - source: MUST match the provenance from analysis ('Observed' or 'Inferred' or 'Unknown'), or 'User-provided' for preferences/notes.
         - contribution: Clear rationale of how this attribute supports the cut.
      6. Attribute Provenance & Cautious Wording:
         - Keep 'Observed', 'Inferred', and 'Unknown' distinctions strictly accurate.
         - NEVER present inferred attributes as confirmed observations. Use cautious phrasing (e.g. 'Likely oval face', 'Appears to have thicker density').
         - NEVER invent claims about unknown attributes. If an attribute is unknown, state that density or texture should be confirmed with the barber.
      7. User Preferences Separation:
         - User notes (e.g. 'cepak') and preferences are strictly 'User-provided' preferences, NEVER photo observations.
         - User notes may influence haircut selection and length, but must never be presented as photo evidence or appended to the canonical name.
      8. Ground the reasons in the user's hair attributes (face shape, hair line, length).
      9. Determine feasibility based on existing analysis, current hair condition, target hairstyle, and constraints.
         - 'Ready Now': realistically achievable now.
         - 'Possible with Adjustment': achievable with reasonable adjustment.
         - 'Transition Required': requires meaningful transition/grow-out.
         - 'Not Currently Realistic': not realistically achievable.
      10. For 'Transition Required' or 'Not Currently Realistic', provide transitionGuidance explaining limitations or what needs to change.
      11. Do not invent unsupported exact measurements, timelines, hair growth rates, or technical details not supported by analysis.
      12. Generate a structured barberBrief organizing practical handoff information into top, sides, back, fringe, styling, maintenance, preserve, and avoid. Ensure barber brief does not contradict analysis.
      13. Measurement Safety: Do NOT invent unsupported exact measurements (e.g. millimetres, inches, neckline measurements, crown measurements, clipper guard numbers). When an exact detail cannot be reliably determined from the available evidence, use "Confirm with barber". Do not fabricate precision.`,
        output: {
          schema: RecommendationSchema
        }
      });

      const recommendationsResult = output;

      if (!recommendationsResult || recommendationsResult.recommendations.length === 0) {
        throw new Error('No recommendations generated.');
      }

      // Resolve and validate best match deterministically based on feasibility
      resolveBestMatch(recommendationsResult.recommendations);

      // Validate and align evidence provenance, canonical names, and consistency
      validateAndAlignEvidence(
        recommendationsResult.recommendations,
        state.analysis,
        input.preferences
      );

      state.status = 'RECOMMENDATIONS_READY';
      state.recommendations = recommendationsResult.recommendations;
      state.preferences = input.preferences ? { ...input.preferences } : undefined;
      // T4.5: Reset selection when generating new recommendations
      state.selectedHairstyleId = undefined;

      await saveRevision(input.revisionId, state);

      return { route: 'SUCCESS' as const, recommendations: recommendationsResult, message: 'Recommendations ready.' };
    } catch (err: any) {
      console.error('Recommendation error:', err);
      return { route: 'RETRY_REQUIRED' as const, message: err.message || 'Recommendation failed.' };
    } finally {
      state.recommendationPromise = undefined;
      state.recommendationPromisePreferences = undefined;
    }
  })();

  return await state.recommendationPromise;
});

// T4.7: Deterministic endpoint to select a hairstyle
export const selectHairstyleHandler = async (req: Request, res: Response) => {
  const { revisionId, hairstyleId } = req.body;
  const state = await getOrHydrateRevision(revisionId);

  if (!state || !state.recommendations) {
    return res.status(400).json({ status: 'error', message: 'Invalid state for selection.' });
  }

  const style = state.recommendations.find(r => r.id === hairstyleId);
  if (!style) {
    return res.status(404).json({ status: 'error', message: 'Hairstyle not found in recommendations.' });
  }

  state.selectedHairstyleId = hairstyleId;
  state.status = 'READY_FOR_PREVIEW';

  await saveRevision(revisionId, state);

  console.log(`[style_selected] Revision: ${revisionId}, Style: ${hairstyleId}`);

  res.json({ status: 'success', route: 'READY_FOR_PREVIEW', selectedHairstyleId: hairstyleId });
};

export const recommendationHandler = async (req: Request, res: Response) => {
  const reqId = req.headers['x-request-id'] || crypto.randomUUID();
  const { revisionId, preferences } = req.body;

  if (!revisionId) {
    return res.status(400).json({ status: 'error', route: 'STALE', message: 'revisionId is required' });
  }

  try {
    const start = Date.now();
    const result = await recommendationFlow({ revisionId, preferences });
    const latencyMs = Date.now() - start;

    console.log(`[recommendations_viewed] Request: ${reqId}, Revision: ${revisionId}, Latency: ${latencyMs}ms`);

    res.json({
      status: 'success',
      requestId: reqId,
      ...result
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'error',
      requestId: reqId,
      message: err.message || 'Internal server error'
    });
  }
};
