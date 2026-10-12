import request from 'supertest';
import app from '../src/app';
import { revisions } from '../src/state';
import { RecommendationSchema, resolveBestMatch } from '../src/recommendation';

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
});
