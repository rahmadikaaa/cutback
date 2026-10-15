import request from 'supertest';
import app from '../src/app';
import { revisions, type RevisionState } from '../src/state';
import * as firestoreDb from '../src/firestoreDb';

describe('Firestore Revision Hydration (Phase 1)', () => {
  beforeEach(() => {
    revisions.clear();
    jest.restoreAllMocks();
  });

  afterAll(() => {
    revisions.clear();
    jest.restoreAllMocks();
  });

  describe('getOrHydrateRevision unit tests', () => {
    it('1. should retrieve revision from in-memory cache when present (cache hit)', async () => {
      const memoryState: RevisionState = {
        id: 'rev-memory-hit',
        status: 'ANALYZED',
        imageBase64: 'fake-b64-memory',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'oval', source: 'Inferred' },
            hairType: { value: 'straight', source: 'Observed' },
            hairLength: { value: 'short', source: 'Observed' },
            hairThickness: { value: 'medium', source: 'Observed' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
      };

      revisions.set('rev-memory-hit', memoryState);

      const getRevisionSpy = jest.spyOn(firestoreDb, 'getRevision');

      const result = await firestoreDb.getOrHydrateRevision('rev-memory-hit');

      expect(result).toBe(memoryState);
      expect(result?.id).toBe('rev-memory-hit');
      expect(result?.status).toBe('ANALYZED');
      // Must not query Firestore when cache hits
      expect(getRevisionSpy).not.toHaveBeenCalled();
    });

    it('2. should recover revision from Firestore on cache miss and restore into memory', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-cache-miss',
        status: 'ANALYZED',
        originalImagePath: 'users/123/original.jpg',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'oval', source: 'Inferred' },
            hairType: { value: 'wavy', source: 'Observed' },
            hairLength: { value: 'medium', source: 'Observed' },
            hairThickness: { value: 'thick', source: 'Inferred' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
      };

      // Ensure cache miss
      expect(revisions.has('rev-cache-miss')).toBe(false);

      const getRevisionSpy = jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);

      const result = await firestoreDb.getOrHydrateRevision('rev-cache-miss');

      expect(getRevisionSpy).toHaveBeenCalledWith('rev-cache-miss');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('rev-cache-miss');
      expect(result?.status).toBe('ANALYZED');
      expect(result?.analysis?.attributes?.faceShape.value).toBe('oval');

      // Verify restored in memory cache
      expect(revisions.has('rev-cache-miss')).toBe(true);
      expect(revisions.get('rev-cache-miss')?.id).toBe('rev-cache-miss');
      expect(revisions.get('rev-cache-miss')?.status).toBe('ANALYZED');
    });

    it('3. should handle missing revision when not in memory or Firestore (returns null)', async () => {
      // Ensure cache miss
      expect(revisions.has('rev-nonexistent')).toBe(false);

      const getRevisionSpy = jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(null);

      const result = await firestoreDb.getOrHydrateRevision('rev-nonexistent');

      expect(getRevisionSpy).toHaveBeenCalledWith('rev-nonexistent');
      expect(result).toBeNull();
      expect(revisions.has('rev-nonexistent')).toBe(false);
    });

    it('4. should handle Firestore retrieval failure gracefully without throwing (returns null)', async () => {
      expect(revisions.has('rev-error')).toBe(false);

      const getRevisionSpy = jest.spyOn(firestoreDb, 'getRevision').mockRejectedValue(new Error('Firestore unavailable'));

      const result = await firestoreDb.getOrHydrateRevision('rev-error');

      expect(getRevisionSpy).toHaveBeenCalledWith('rev-error');
      expect(result).toBeNull();
      expect(revisions.has('rev-error')).toBe(false);
    });
  });

  describe('API flow behavior after revision recovery', () => {
    it('5. /api/analyze should return existing analysis via idempotency after revision recovery from Firestore', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-analyzed-hydrated',
        status: 'ANALYZED',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'square', source: 'Inferred' },
            hairType: { value: 'curly', source: 'Observed' },
            hairLength: { value: 'short', source: 'Observed' },
            hairThickness: { value: 'thick', source: 'Observed' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
      };

      // Mock Firestore returning the persisted record on cache miss
      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);

      // Memory cache is empty
      expect(revisions.has('rev-analyzed-hydrated')).toBe(false);

      const res = await request(app)
        .post('/api/analyze')
        .send({ revisionId: 'rev-analyzed-hydrated' });

      expect(res.status).toBe(200);
      expect(res.body.route).toBe('SUCCESS');
      expect(res.body.message).toBe('Analysis already completed.');
      expect(res.body.analysis.attributes.faceShape.value).toBe('square');
      expect(res.body.analysis.attributes.hairType.value).toBe('curly');

      // State is now hydrated in memory
      expect(revisions.has('rev-analyzed-hydrated')).toBe(true);
    });

    it('6. /api/select should succeed after revision with recommendations is recovered from Firestore', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-select-hydrated',
        status: 'RECOMMENDATIONS_READY',
        recommendations: [
          {
            id: 'style-textured-crop',
            name: 'Textured Crop',
            description: 'Short textured style',
            reason: 'Matches face structure',
            stylingEffort: 'low',
            constraints: [],
            isBestMatch: true,
            feasibility: 'Ready Now',
          },
        ],
      };

      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);
      jest.spyOn(firestoreDb, 'saveRevision').mockResolvedValue();

      expect(revisions.has('rev-select-hydrated')).toBe(false);

      const res = await request(app)
        .post('/api/select')
        .send({ revisionId: 'rev-select-hydrated', hairstyleId: 'style-textured-crop' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.route).toBe('READY_FOR_PREVIEW');
      expect(res.body.selectedHairstyleId).toBe('style-textured-crop');

      // State in memory has updated status
      const updated = revisions.get('rev-select-hydrated');
      expect(updated?.status).toBe('READY_FOR_PREVIEW');
      expect(updated?.selectedHairstyleId).toBe('style-textured-crop');
    });

    it('7. /api/recommendations should return STALE if hydrated revision has an invalid state for recommendations', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-stale-hydrated',
        status: 'READY', // Not yet analyzed
      };

      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);

      expect(revisions.has('rev-stale-hydrated')).toBe(false);

      const res = await request(app)
        .post('/api/recommendations')
        .send({ revisionId: 'rev-stale-hydrated' });

      expect(res.status).toBe(200);
      expect(res.body.route).toBe('STALE');
      expect(res.body.message).toContain('Cannot generate recommendations in state: READY');
    });

    it('8. /api/recommendations should reuse cached recommendations after hydration when preferences match', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-recs-hydrated-match',
        status: 'RECOMMENDATIONS_READY',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'oval', source: 'Inferred' },
            hairType: { value: 'straight', source: 'Observed' },
            hairLength: { value: 'medium', source: 'Observed' },
            hairThickness: { value: 'medium', source: 'Observed' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
        preferences: { vibe: 'Classic', desiredLength: 'short' },
        recommendations: [
          {
            id: 'rec-hydrated-1',
            name: 'Classic Side Part',
            description: 'Timeless side part',
            reason: 'Fits oval face shape',
            stylingEffort: 'low',
            constraints: [],
            isBestMatch: true,
            feasibility: 'Ready Now',
          },
        ],
      };

      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);

      expect(revisions.has('rev-recs-hydrated-match')).toBe(false);

      const res = await request(app)
        .post('/api/recommendations')
        .send({
          revisionId: 'rev-recs-hydrated-match',
          preferences: { vibe: 'Classic', desiredLength: 'short' }
        });

      expect(res.status).toBe(200);
      expect(res.body.route).toBe('SUCCESS');
      expect(res.body.message).toBe('Recommendations already generated.');
      expect(res.body.recommendations.recommendations).toHaveLength(1);
      expect(res.body.recommendations.recommendations[0].id).toBe('rec-hydrated-1');

      // In-memory cache is populated with hydrated state
      const inMem = revisions.get('rev-recs-hydrated-match');
      expect(inMem).toBeDefined();
      expect(inMem?.recommendationPromise).toBeUndefined();
      expect(inMem?.recommendationPromisePreferences).toBeUndefined();
    });

    it('9. /api/recommendations should bypass cache after hydration when preferences differ', async () => {
      const persistedRecord: Partial<RevisionState> = {
        id: 'rev-recs-hydrated-diff',
        status: 'RECOMMENDATIONS_READY',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'oval', source: 'Inferred' },
            hairType: { value: 'straight', source: 'Observed' },
            hairLength: { value: 'medium', source: 'Observed' },
            hairThickness: { value: 'medium', source: 'Observed' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
        preferences: { vibe: 'Classic' },
        recommendations: [
          {
            id: 'rec-hydrated-old',
            name: 'Classic Crew Cut',
            description: 'Traditional crew',
            reason: 'Fits face',
            stylingEffort: 'low',
            constraints: [],
            isBestMatch: true,
          },
        ],
      };

      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(persistedRecord);

      expect(revisions.has('rev-recs-hydrated-diff')).toBe(false);

      const res = await request(app)
        .post('/api/recommendations')
        .send({
          revisionId: 'rev-recs-hydrated-diff',
          preferences: { vibe: 'Modern & Textured' }
        });

      expect(res.status).toBe(200);
      // Cache was bypassed (did NOT return "already generated")
      expect(res.body.message).not.toContain('already generated');
    });

    it('10. /api/recommendations should bypass cache when hydrated state has RECOMMENDATIONS_READY but empty recommendations', async () => {
      const partiallyHydratedRecord: Partial<RevisionState> = {
        id: 'rev-partial-hydration',
        status: 'RECOMMENDATIONS_READY',
        analysis: {
          visualSuitability: { isValid: true },
          attributes: {
            faceShape: { value: 'oval', source: 'Inferred' },
            hairType: { value: 'straight', source: 'Observed' },
            hairLength: { value: 'medium', source: 'Observed' },
            hairThickness: { value: 'medium', source: 'Observed' },
            hairLine: { value: 'straight', source: 'Observed' },
          },
        },
        preferences: { vibe: 'Low Maintenance' },
        recommendations: [], // Broken/empty recommendations despite status
      };

      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue(partiallyHydratedRecord);

      const res = await request(app)
        .post('/api/recommendations')
        .send({
          revisionId: 'rev-partial-hydration',
          preferences: { vibe: 'Low Maintenance' }
        });

      expect(res.status).toBe(200);
      // Empty recommendations must NOT be returned as cached success
      expect(res.body.message).not.toBe('Recommendations already generated.');
    });

    it('11. transient promises are never persisted and remain undefined after hydration', async () => {
      const dummyPromise = Promise.resolve();
      const inMemoryState: RevisionState = {
        id: 'rev-transient-test',
        status: 'RECOMMENDATIONS_READY',
        analysis: { visualSuitability: { isValid: true } },
        preferences: { vibe: 'Sharp' },
        recommendations: [{ id: '1', name: 'Fade' }],
        recommendationPromise: dummyPromise,
        recommendationPromisePreferences: { vibe: 'Sharp' },
      };

      // saveRevision should be callable and strip transient promises
      await firestoreDb.saveRevision('rev-transient-test', inMemoryState);

      // Hydration creates fresh state with undefined transient promises
      jest.spyOn(firestoreDb, 'getRevision').mockResolvedValue({
        id: 'rev-transient-test',
        status: 'RECOMMENDATIONS_READY',
        analysis: { visualSuitability: { isValid: true } },
        preferences: { vibe: 'Sharp' },
        recommendations: [{ id: '1', name: 'Fade' }],
      });

      revisions.delete('rev-transient-test');
      const hydrated = await firestoreDb.getOrHydrateRevision('rev-transient-test');

      expect(hydrated).not.toBeNull();
      expect(hydrated?.recommendationPromise).toBeUndefined();
      expect(hydrated?.recommendationPromisePreferences).toBeUndefined();
    });
  });
});
