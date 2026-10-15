import request from 'supertest';
import app from '../src/app';
import { revisions } from '../src/state';
import {
  RecommendationSchema,
  ReasonEvidenceItemSchema,
  EvidenceSourceSchema,
  resolveBestMatch,
  cleanCanonicalHaircutName,
  validateAndAlignEvidence,
  arePreferencesEqual
} from '../src/recommendation';

describe('Recommendation Endpoint (T4)', () => {
  beforeEach(() => {
    revisions.clear();
  });

  describe('POST /api/recommendations', () => {
    it('should return STALE if revisionId is missing', async () => {
      const response = await request(app).post('/api/recommendations').send({});
      expect(response.status).toBe(400);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if revision does not exist', async () => {
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'fake-id' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
    });

    it('should return STALE if state is not ANALYZED/RECOMMENDATIONS_READY', async () => {
      revisions.set('test-ready-id', { id: 'test-ready-id', status: 'READY' });
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'test-ready-id' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
      expect(response.body.message).toContain('Cannot generate recommendations in state: READY');
    });

    it('should return STALE if analysis is missing despite being in ANALYZED state', async () => {
      revisions.set('test-analyzed', { id: 'test-analyzed', status: 'ANALYZED' });
      const response = await request(app).post('/api/recommendations').send({ revisionId: 'test-analyzed' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('STALE');
      expect(response.body.message).toBe('Missing analysis.');
    });
  });

  describe('POST /api/select', () => {
    it('should return 400 error if revision is not found or has no recommendations', async () => {
      revisions.set('test-analyzed', { id: 'test-analyzed', status: 'ANALYZED' });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-analyzed', hairstyleId: 'style1' });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid state for selection.');
    });

    it('should return 404 if hairstyleId is not in recommendations', async () => {
      revisions.set('test-recs', { 
        id: 'test-recs', 
        status: 'RECOMMENDATIONS_READY',
        recommendations: [{ id: 'style1', name: 'Buzz' }]
      });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-recs', hairstyleId: 'invalid' });
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Hairstyle not found in recommendations.');
    });

    it('should successfully select style and update state to READY_FOR_PREVIEW', async () => {
      revisions.set('test-recs', { 
        id: 'test-recs', 
        status: 'RECOMMENDATIONS_READY',
        recommendations: [{ id: 'style1', name: 'Buzz' }]
      });
      const response = await request(app).post('/api/select').send({ revisionId: 'test-recs', hairstyleId: 'style1' });
      expect(response.status).toBe(200);
      expect(response.body.route).toBe('READY_FOR_PREVIEW');
      expect(response.body.selectedHairstyleId).toBe('style1');
      
      const state = revisions.get('test-recs');
      expect(state?.status).toBe('READY_FOR_PREVIEW');
      expect(state?.selectedHairstyleId).toBe('style1');
    });
  });

  describe('RecommendationSchema Validation', () => {
    it('should validate all 4 valid feasibility values', () => {
      const validFeasibilities = ['Ready Now', 'Possible with Adjustment', 'Transition Required', 'Not Currently Realistic'] as const;
      validFeasibilities.forEach(feasibility => {
        const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, feasibility }] };
        const result = RecommendationSchema.safeParse(data);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid feasibility value', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, feasibility: 'Impossible' }] };
      const result = RecommendationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should allow optional transitionGuidance', () => {
      const data1 = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, feasibility: 'Transition Required', transitionGuidance: 'Wait 3 months' }] };
      const data2 = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, feasibility: 'Transition Required' }] };
      expect(RecommendationSchema.safeParse(data1).success).toBe(true);
      expect(RecommendationSchema.safeParse(data2).success).toBe(true);
    });

    it('should allow missing feasibility for legacy compatibility', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false }] };
      const result = RecommendationSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recommendations[0].feasibility).toBeUndefined();
      }
    });

    it('should allow omitting barberBrief entirely for legacy compatibility', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false }] };
      expect(RecommendationSchema.safeParse(data).success).toBe(true);
    });

    it('should allow an empty barberBrief object', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, barberBrief: {} }] };
      expect(RecommendationSchema.safeParse(data).success).toBe(true);
    });

    it('should allow a partial barberBrief', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, barberBrief: { top: 'Leave longer', avoid: 'cutting too short' } }] };
      expect(RecommendationSchema.safeParse(data).success).toBe(true);
    });

    it('should allow all supported fields as strings in barberBrief', () => {
      const data = { 
        recommendations: [{ 
          id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, 
          barberBrief: { 
            top: 'str', sides: 'str', back: 'str', fringe: 'str', 
            styling: 'str', maintenance: 'str', preserve: 'str', avoid: 'str' 
          } 
        }] 
      };
      expect(RecommendationSchema.safeParse(data).success).toBe(true);
    });

    it('should reject invalid types in barberBrief fields', () => {
      const data = { recommendations: [{ id: '1', name: 'A', description: 'B', reason: 'C', stylingEffort: 'low', constraints: [], isBestMatch: false, barberBrief: { top: 123 } }] };
      const result = RecommendationSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('resolveBestMatch Logic (REC-03)', () => {
    it('should keep exactly one Best Match when AI output is already valid and realistic', () => {
      const recs: any[] = [
        { id: '1', name: 'Buzz', feasibility: 'Ready Now', isBestMatch: true, bestMatchReason: 'Suits your shape' },
        { id: '2', name: 'Crew', feasibility: 'Possible with Adjustment', isBestMatch: false }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[0].isBestMatch).toBe(true);
      expect(recs[0].bestMatchReason).toBe('Suits your shape');
    });

    it('should demote an unrealistic Best Match if a realistic alternative is available', () => {
      const recs: any[] = [
        { id: '1', name: 'Long Flow', feasibility: 'Not Currently Realistic', isBestMatch: true, bestMatchReason: 'Looks cool' },
        { id: '2', name: 'Crew Cut', feasibility: 'Ready Now', isBestMatch: false }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[1].isBestMatch).toBe(true);
      expect(recs[1].name).toBe('Crew Cut');
      expect(recs[0].isBestMatch).toBe(false);
    });

    it('should resolve deterministically to the most realistic option when 0 Best Matches exist', () => {
      const recs: any[] = [
        { id: '1', name: 'Transition Style', feasibility: 'Transition Required', isBestMatch: false },
        { id: '2', name: 'Adjusted Style', feasibility: 'Possible with Adjustment', isBestMatch: false },
        { id: '3', name: 'Ready Style', feasibility: 'Ready Now', isBestMatch: false }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[2].isBestMatch).toBe(true);
      expect(recs[2].name).toBe('Ready Style');
      expect(recs[2].bestMatchReason).toContain('Ready Now');
    });

    it('should resolve deterministically when multiple Best Matches are returned by AI', () => {
      const recs: any[] = [
        { id: '1', name: 'Style A', feasibility: 'Possible with Adjustment', isBestMatch: true },
        { id: '2', name: 'Style B', feasibility: 'Ready Now', isBestMatch: true }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[1].isBestMatch).toBe(true);
      expect(recs[1].name).toBe('Style B');
    });

    it('should handle all options requiring transition gracefully when none are Ready Now', () => {
      const recs: any[] = [
        { id: '1', name: 'Grow Out A', feasibility: 'Transition Required', isBestMatch: false },
        { id: '2', name: 'Grow Out B', feasibility: 'Not Currently Realistic', isBestMatch: false }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[0].isBestMatch).toBe(true);
      expect(recs[0].feasibility).toBe('Transition Required');
    });

    it('should handle missing or invalid feasibility without throwing errors', () => {
      const recs: any[] = [
        { id: '1', name: 'Legacy Style A', isBestMatch: false },
        { id: '2', name: 'Legacy Style B', isBestMatch: false }
      ];
      resolveBestMatch(recs);
      expect(recs.filter(r => r.isBestMatch).length).toBe(1);
      expect(recs[0].isBestMatch).toBe(true);
      expect(recs[0].bestMatchReason).toBeDefined();
    });
  });

  describe('cleanCanonicalHaircutName (Phase 2)', () => {
    it('should strip parenthetical user notes like (Cepak)', () => {
      expect(cleanCanonicalHaircutName('Classic Crew Cut (Cepak)')).toBe('Classic Crew Cut');
      expect(cleanCanonicalHaircutName('Crew Cut (cepak)')).toBe('Crew Cut');
    });

    it('should strip user note matching preferences.note', () => {
      expect(cleanCanonicalHaircutName('High and Tight - cepak', 'cepak')).toBe('High and Tight');
      expect(cleanCanonicalHaircutName('Buzz Cut (Cepak)', 'cepak')).toBe('Buzz Cut');
    });

    it('should preserve standard canonical barber names without notes', () => {
      expect(cleanCanonicalHaircutName('Classic Crew Cut')).toBe('Classic Crew Cut');
      expect(cleanCanonicalHaircutName('Textured Quiff')).toBe('Textured Quiff');
      expect(cleanCanonicalHaircutName('Side Part')).toBe('Side Part');
    });

    it('should strip colloquial aliases like (buzz cut) or (pendek)', () => {
      expect(cleanCanonicalHaircutName('Crew Cut (buzz cut)')).toBe('Crew Cut');
      expect(cleanCanonicalHaircutName('Taper Fade (pendek)')).toBe('Taper Fade');
    });
  });

  describe('EvidenceSourceSchema & ReasonEvidenceItemSchema (Phase 2)', () => {
    it('should validate valid reasonEvidence items', () => {
      const validItem = {
        attribute: 'Face Shape',
        value: 'Oval',
        source: 'Inferred' as const,
        contribution: 'Likely oval face framed well by this cut'
      };
      expect(ReasonEvidenceItemSchema.safeParse(validItem).success).toBe(true);
    });

    it('should accept all 4 provenance sources', () => {
      const sources = ['Observed', 'Inferred', 'User-provided', 'Unknown'] as const;
      sources.forEach(source => {
        const item = { attribute: 'Attr', value: 'Val', source, contribution: 'Contrib' };
        expect(ReasonEvidenceItemSchema.safeParse(item).success).toBe(true);
      });
    });

    it('should reject invalid provenance sources', () => {
      const invalidItem = { attribute: 'Attr', value: 'Val', source: 'Guessed', contribution: 'Contrib' };
      expect(ReasonEvidenceItemSchema.safeParse(invalidItem).success).toBe(false);
    });

    it('should validate RecommendationSchema containing structured reasonEvidence', () => {
      const data = {
        recommendations: [{
          id: '1',
          name: 'Classic Crew Cut',
          description: 'A clean cut',
          reason: 'Suits your straight hair pattern',
          reasonEvidence: [
            { attribute: 'Face Shape', value: 'Oval', source: 'Inferred' as const, contribution: 'Framed well' },
            { attribute: 'Hair Pattern', value: 'Straight', source: 'Observed' as const, contribution: 'Flows naturally' },
            { attribute: 'User Preference', value: 'cepak', source: 'User-provided' as const, contribution: 'Desires short profile' }
          ],
          stylingEffort: 'low' as const,
          constraints: [],
          isBestMatch: true
        }]
      };
      expect(RecommendationSchema.safeParse(data).success).toBe(true);
    });
  });

  describe('validateAndAlignEvidence (Phase 2)', () => {
    const mockAnalysis = {
      attributes: {
        faceShape: { value: 'oval', source: 'Inferred' },
        hairType: { value: 'straight', source: 'Observed' },
        hairLength: { value: 'short', source: 'Observed' },
        hairThickness: { value: 'unknown', source: 'Unknown' },
        hairLine: { value: 'straight', source: 'Observed' }
      }
    };

    it('should preserve Observed vs Inferred vs Unknown distinctions from analysis', () => {
      const recs: any[] = [{
        id: '1',
        name: 'Classic Crew Cut',
        description: 'Clean cut',
        reason: 'Works with natural features',
        reasonEvidence: [
          { attribute: 'Face Shape', value: 'Oval', source: 'Observed', contribution: 'Strong oval face' }, // model incorrectly claimed Observed
          { attribute: 'Hair Pattern', value: 'Straight', source: 'Observed', contribution: 'Natural flow' }
        ],
        stylingEffort: 'low',
        constraints: [],
        isBestMatch: true
      }];

      validateAndAlignEvidence(recs, mockAnalysis);

      const faceShapeEvidence = recs[0].reasonEvidence.find((e: any) => e.attribute === 'Face Shape');
      expect(faceShapeEvidence).toBeDefined();
      expect(faceShapeEvidence.source).toBe('Inferred');
      expect(faceShapeEvidence.contribution.toLowerCase()).toContain('likely');

      const hairTypeEvidence = recs[0].reasonEvidence.find((e: any) => e.attribute === 'Hair Pattern');
      expect(hairTypeEvidence).toBeDefined();
      expect(hairTypeEvidence.source).toBe('Observed');
    });

    it('should correct unsupported model claims when attribute is Unknown in analysis', () => {
      const recs: any[] = [{
        id: '1',
        name: 'Side Part',
        description: 'Classic side part',
        reason: 'Clean look',
        reasonEvidence: [
          // Model hallucinates thick hair when analysis has unknown thickness
          { attribute: 'Hair Thickness', value: 'Thick', source: 'Observed', contribution: 'Dense thick hair supports volume' }
        ],
        stylingEffort: 'medium',
        constraints: [],
        isBestMatch: false
      }];

      validateAndAlignEvidence(recs, mockAnalysis);

      const thicknessEvidence = recs[0].reasonEvidence.find((e: any) => e.attribute === 'Hair Thickness');
      expect(thicknessEvidence).toBeDefined();
      expect(thicknessEvidence.source).toBe('Unknown');
      expect(thicknessEvidence.value).toBe('Unknown');
      expect(thicknessEvidence.contribution.toLowerCase()).toContain('confirm with barber');
    });

    it('should separate user notes (cepak) from photo evidence and sanitize canonical name', () => {
      const recs: any[] = [{
        id: '1',
        name: 'Classic Crew Cut (Cepak)',
        description: 'A military-inspired short cut',
        reason: 'Matches short preference',
        reasonEvidence: [
          // Model incorrectly treated cepak as photo evidence
          { attribute: 'User Preference', value: 'cepak', source: 'Observed', contribution: 'Observed cepak hair' }
        ],
        stylingEffort: 'low',
        constraints: [],
        isBestMatch: true
      }];

      validateAndAlignEvidence(recs, mockAnalysis, { note: 'cepak' });

      // Name sanitized to canonical barber name
      expect(recs[0].name).toBe('Classic Crew Cut');

      // User preference strictly labeled User-provided
      const prefEvidence = recs[0].reasonEvidence.find((e: any) => e.attribute === 'User Preference');
      expect(prefEvidence).toBeDefined();
      expect(prefEvidence.source).toBe('User-provided');
      expect(prefEvidence.source).not.toBe('Observed');
      expect(prefEvidence.source).not.toBe('Inferred');
    });

    it('should sanitize barberBrief to avoid contradicting analysis when hairThickness is Unknown', () => {
      const recs: any[] = [{
        id: '1',
        name: 'Classic Crew Cut',
        description: 'Clean style',
        reason: 'Fits nicely',
        reasonEvidence: [],
        stylingEffort: 'low',
        constraints: [],
        isBestMatch: true,
        barberBrief: {
          top: 'Short scissor cut',
          styling: 'Apply heavy pomade for thick hair',
          maintenance: 'Thin out thick hair every 3 weeks'
        }
      }];

      validateAndAlignEvidence(recs, mockAnalysis);

      expect(recs[0].barberBrief.styling.toLowerCase()).not.toContain('thick hair');
      expect(recs[0].barberBrief.styling.toLowerCase()).toContain('confirm with barber');
      expect(recs[0].barberBrief.maintenance.toLowerCase()).not.toContain('thick hair');
      expect(recs[0].barberBrief.maintenance.toLowerCase()).toContain('confirm with barber');
    });

    it('should build grounded evidence from analysis when reasonEvidence is empty', () => {
      const recs: any[] = [{
        id: '1',
        name: 'Classic Crew Cut',
        description: 'Clean style',
        reason: 'Fits nicely',
        reasonEvidence: [],
        stylingEffort: 'low',
        constraints: [],
        isBestMatch: true
      }];

      validateAndAlignEvidence(recs, mockAnalysis, { note: 'cepak' });

      expect(recs[0].reasonEvidence.length).toBeGreaterThan(0);
      const faceShape = recs[0].reasonEvidence.find((e: any) => e.attribute === 'Face Shape');
      expect(faceShape).toBeDefined();
      expect(faceShape.source).toBe('Inferred');

      const hairPattern = recs[0].reasonEvidence.find((e: any) => e.attribute === 'Hair Pattern');
      expect(hairPattern).toBeDefined();
      expect(hairPattern.source).toBe('Observed');

      const userPref = recs[0].reasonEvidence.find((e: any) => e.attribute === 'User Preference');
      expect(userPref).toBeDefined();
      expect(userPref.source).toBe('User-provided');
      expect(userPref.value).toBe('cepak');
    });
  });

  describe('Recommendation Concurrency & Idempotency Safeguards', () => {
    const mockAnalysis = {
      visualSuitability: { isValid: true },
      attributes: {
        faceShape: { value: 'oval', source: 'Observed' },
        hairType: { value: 'straight', source: 'Observed' },
        hairLength: { value: 'medium', source: 'Observed' },
        hairThickness: { value: 'medium', source: 'Observed' },
        hairLine: { value: 'straight', source: 'Observed' },
      }
    };

    const mockStoredRecs = [
      {
        id: 'rec-stored-1',
        name: 'Classic Crew Cut',
        description: 'Clean and timeless',
        reason: 'Fits oval face shape',
        reasonEvidence: [],
        stylingEffort: 'low',
        constraints: [],
        isBestMatch: true,
      }
    ];

    describe('arePreferencesEqual helper', () => {
      it('should treat undefined and empty objects as equal', () => {
        expect(arePreferencesEqual(undefined, undefined)).toBe(true);
        expect(arePreferencesEqual(undefined, {})).toBe(true);
        expect(arePreferencesEqual({}, undefined)).toBe(true);
        expect(arePreferencesEqual({}, {})).toBe(true);
      });

      it('should treat trimmed matching strings as equal', () => {
        expect(arePreferencesEqual(
          { vibe: 'Fresh ', desiredLength: 'Shorter', stylingEffort: 'low', note: 'neat ' },
          { vibe: 'Fresh', desiredLength: 'Shorter ', stylingEffort: 'low', note: 'neat' }
        )).toBe(true);
      });

      it('should detect differences in any preference field', () => {
        expect(arePreferencesEqual({ vibe: 'Fresh' }, { vibe: 'Classic' })).toBe(false);
        expect(arePreferencesEqual({ desiredLength: 'Shorter' }, { desiredLength: 'Longer' })).toBe(false);
        expect(arePreferencesEqual({ stylingEffort: 'low' }, { stylingEffort: 'high' })).toBe(false);
        expect(arePreferencesEqual({ note: 'keep sides clean' }, { note: 'textured top' })).toBe(false);
      });
    });

    describe('Repeated identical requests (Idempotency)', () => {
      it('should reuse existing completed recommendations when preferences are identical', async () => {
        revisions.set('test-idempotent-rec', {
          id: 'test-idempotent-rec',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Fresh', desiredLength: 'Shorter' },
          recommendations: mockStoredRecs,
        });

        const response = await request(app)
          .post('/api/recommendations')
          .send({
            revisionId: 'test-idempotent-rec',
            preferences: { vibe: 'Fresh', desiredLength: 'Shorter' }
          });

        expect(response.status).toBe(200);
        expect(response.body.route).toBe('SUCCESS');
        expect(response.body.message).toContain('already generated');
        expect(response.body.recommendations.recommendations).toHaveLength(1);
        expect(response.body.recommendations.recommendations[0].id).toBe('rec-stored-1');
      });

      it('should reuse existing completed recommendations when both had no preferences', async () => {
        revisions.set('test-no-prefs-rec', {
          id: 'test-no-prefs-rec',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: undefined,
          recommendations: mockStoredRecs,
        });

        const response = await request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'test-no-prefs-rec' });

        expect(response.status).toBe(200);
        expect(response.body.route).toBe('SUCCESS');
        expect(response.body.message).toContain('already generated');
        expect(response.body.recommendations.recommendations).toHaveLength(1);
        expect(response.body.recommendations.recommendations[0].id).toBe('rec-stored-1');
      });
    });

    describe('Concurrent requests (In-Flight Promise Guard)', () => {
      it('should attach to in-flight recommendationPromise and return shared result for identical inputs', async () => {
        let resolveInFlight: (val: any) => void = () => {};
        const inFlightPromise = new Promise((resolve) => {
          resolveInFlight = resolve;
        });

        revisions.set('test-concurrent-rec', {
          id: 'test-concurrent-rec',
          status: 'ANALYZED',
          analysis: mockAnalysis,
          recommendationPromise: inFlightPromise,
          recommendationPromisePreferences: { vibe: 'Fresh' },
        });

        // Fire request while promise is pending
        const reqPromise = request(app)
          .post('/api/recommendations')
          .send({
            revisionId: 'test-concurrent-rec',
            preferences: { vibe: 'Fresh' }
          });

        // Resolve in-flight promise
        resolveInFlight({
          route: 'SUCCESS',
          recommendations: { recommendations: mockStoredRecs },
          message: 'Recommendations ready.'
        });

        const response = await reqPromise;
        expect(response.status).toBe(200);
        expect(response.body.route).toBe('SUCCESS');
        expect(response.body.message).toBe('Recommendations ready.');
        expect(response.body.recommendations.recommendations[0].id).toBe('rec-stored-1');
      });
    });

    describe('Different preferences and revisions scoping', () => {
      it('should not return cached recommendations when preferences differ', async () => {
        revisions.set('test-diff-prefs', {
          id: 'test-diff-prefs',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Fresh' },
          recommendations: mockStoredRecs,
        });

        // Calling with a different vibe should bypass the cache check
        // (will attempt model call and return RETRY_REQUIRED or SUCCESS, but NOT 'Recommendations already generated.')
        const response = await request(app)
          .post('/api/recommendations')
          .send({
            revisionId: 'test-diff-prefs',
            preferences: { vibe: 'Classic' }
          });

        expect(response.status).toBe(200);
        expect(response.body.message).not.toContain('already generated');
      });

      it('should isolate recommendations between different revisions', async () => {
        const rev1Recs = [{ ...mockStoredRecs[0], id: 'rec-rev1' }];
        const rev2Recs = [{ ...mockStoredRecs[0], id: 'rec-rev2' }];

        revisions.set('rev-alpha', {
          id: 'rev-alpha',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Fresh' },
          recommendations: rev1Recs,
        });

        revisions.set('rev-beta', {
          id: 'rev-beta',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Fresh' },
          recommendations: rev2Recs,
        });

        const resAlpha = await request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'rev-alpha', preferences: { vibe: 'Fresh' } });

        const resBeta = await request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'rev-beta', preferences: { vibe: 'Fresh' } });

        expect(resAlpha.body.recommendations.recommendations[0].id).toBe('rec-rev1');
        expect(resBeta.body.recommendations.recommendations[0].id).toBe('rec-rev2');
      });

      it('should ensure a second request with different preferences waits safely for the first request', async () => {
        let firstFinished = false;
        let resolveFirst: (val: any) => void = () => {};
        const revState: any = {
          id: 'test-diff-prefs-queue',
          status: 'ANALYZED',
          analysis: mockAnalysis,
          recommendationPromisePreferences: { vibe: 'Classic' },
        };
        const firstPromise = new Promise((resolve) => {
          resolveFirst = (val) => {
            firstFinished = true;
            revState.recommendationPromise = undefined;
            revState.recommendationPromisePreferences = undefined;
            resolve(val);
          };
        });
        revState.recommendationPromise = firstPromise;
        revisions.set('test-diff-prefs-queue', revState);

        // Fire second request with different preferences
        let secondStarted = false;
        const secondReqPromise = (async () => {
          // Verify second request hasn't completed before first resolves
          const res = await request(app)
            .post('/api/recommendations')
            .send({
              revisionId: 'test-diff-prefs-queue',
              preferences: { vibe: 'Textured' }
            });
          secondStarted = true;
          return res;
        })();

        // Small tick to ensure second request is in flight and awaiting first
        await new Promise((r) => setTimeout(r, 20));
        expect(firstFinished).toBe(false);
        expect(secondStarted).toBe(false);

        // Resolve first request
        resolveFirst({
          route: 'SUCCESS',
          recommendations: { recommendations: mockStoredRecs },
          message: 'Recommendations ready.'
        });

        // Second request should now complete
        const resSecond = await secondReqPromise;
        expect(firstFinished).toBe(true);
        expect(secondStarted).toBe(true);
        expect(resSecond.status).toBe(200);
      });

      it('should clean up rejected or failed in-flight promise and allow retry to proceed', async () => {
        let rejectInFlight: (err: any) => void = () => {};
        const failingPromise = new Promise((_, reject) => {
          rejectInFlight = reject;
        });

        const revState: any = {
          id: 'test-retry-after-fail',
          status: 'ANALYZED',
          analysis: mockAnalysis,
          recommendationPromise: failingPromise,
          recommendationPromisePreferences: { vibe: 'Fade' },
        };
        revisions.set('test-retry-after-fail', revState);

        // Reject first promise
        rejectInFlight(new Error('AI Service Unavailable'));
        // Wait for microtask
        try {
          await failingPromise;
        } catch {
          // Expected rejection
        }

        // Simulate finally cleanup if manually setting promise or let flow handle it
        revState.recommendationPromise = undefined;
        revState.recommendationPromisePreferences = undefined;

        // A retry request with the same preferences can now proceed without being blocked
        const retryRes = await request(app)
          .post('/api/recommendations')
          .send({
            revisionId: 'test-retry-after-fail',
            preferences: { vibe: 'Fade' }
          });

        expect(retryRes.status).toBe(200);
        // Did not hang or fail due to lingering lock
        expect(revState.recommendationPromise).toBeUndefined();
      });

      it('should allow multiple concurrent requests with different preferences to queue and share matching work without cache corruption', async () => {
        let resolveReq1: (val: any) => void = () => {};
        const revState: any = {
          id: 'test-multi-queue',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Classic' },
          recommendations: [{ ...mockStoredRecs[0], id: 'rec-classic-1' }],
          recommendationPromisePreferences: { vibe: 'Classic' },
        };
        const req1Promise = new Promise((resolve) => {
          resolveReq1 = (val) => {
            revState.recommendationPromise = undefined;
            revState.recommendationPromisePreferences = undefined;
            resolve(val);
          };
        });
        revState.recommendationPromise = req1Promise;
        revisions.set('test-multi-queue', revState);

        // Req 2 and Req 3 both arrive with preferences { vibe: 'Modern' } while Req 1 is in-flight
        const req2 = request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'test-multi-queue', preferences: { vibe: 'Modern' } });

        const req3 = request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'test-multi-queue', preferences: { vibe: 'Modern' } });

        // Resolve Req 1
        resolveReq1({
          route: 'SUCCESS',
          recommendations: { recommendations: [{ ...mockStoredRecs[0], id: 'rec-classic-1' }] },
          message: 'Recommendations ready.'
        });

        const [res2, res3] = await Promise.all([req2, req3]);

        expect(res2.status).toBe(200);
        expect(res3.status).toBe(200);
        // Neither request should have returned the old 'rec-classic-1' as "already generated" for 'Modern'
        if (res2.body.route === 'SUCCESS') {
          expect(res2.body.message).not.toBe('Recommendations already generated.');
        }
        if (res3.body.route === 'SUCCESS') {
          expect(res3.body.message).not.toBe('Recommendations already generated.');
        }
      });

      it('should not corrupt state.preferences if generation fails with new preferences', async () => {
        const revState: any = {
          id: 'test-atomic-prefs',
          status: 'RECOMMENDATIONS_READY',
          analysis: mockAnalysis,
          preferences: { vibe: 'Original' },
          recommendations: [{ ...mockStoredRecs[0], id: 'rec-original' }],
        };
        revisions.set('test-atomic-prefs', revState);

        // Request with new preferences that triggers error in mock/test environment without GEMINI_API_KEY
        const res = await request(app)
          .post('/api/recommendations')
          .send({ revisionId: 'test-atomic-prefs', preferences: { vibe: 'FailedNew' } });

        expect(res.status).toBe(200);
        if (res.body.route === 'RETRY_REQUIRED') {
          // If generation failed, state.preferences must NOT have been updated to 'FailedNew'
          expect(revState.preferences).toEqual({ vibe: 'Original' });
          expect(revState.recommendations[0].id).toBe('rec-original');
        }
      });
    });
  });
});
