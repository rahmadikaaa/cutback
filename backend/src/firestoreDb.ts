import { getFirestore, isCloudEnabled } from './firebase';
import { revisions, type RevisionState } from './state';

const COLLECTION_REVISIONS = 'revisions';

function withTimeout<T>(promise: Promise<T>, ms: number, fallbackVal: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => {
      const timer = setTimeout(() => resolve(fallbackVal), ms);
      if (typeof timer.unref === 'function') timer.unref();
    }),
  ]);
}

/**
 * Saves a revision state to Firestore.
 * Strips out large payloads like images and transient objects like Promises.
 */
export async function saveRevision(revisionId: string, state: RevisionState): Promise<void> {
  if (!isCloudEnabled()) return;

  const db = getFirestore();
  if (!db) return;

  // Extract only the structured data we want to persist
  const {
    id,
    status,
    analysis,
    preferences,
    recommendations,
    selectedHairstyleId,
    previewState,
    error,
    originalImagePath,
    previewImagePath,
  } = state;

  const docData = {
    id,
    status,
    ...(analysis && { analysis }),
    ...(preferences && { preferences }),
    ...(recommendations && { recommendations }),
    ...(selectedHairstyleId && { selectedHairstyleId }),
    ...(previewState && { previewState }),
    ...(error && { error }),
    ...(originalImagePath && { originalImagePath }),
    ...(previewImagePath && { previewImagePath }),
    updatedAt: new Date().toISOString(), // Adding a timestamp for good measure
  };

  try {
    await withTimeout(
      db.collection(COLLECTION_REVISIONS).doc(revisionId).set(docData, { merge: true }),
      3000,
      null
    );
  } catch (err: any) {
    console.error(`[firestoreDb] Failed to save revision ${revisionId}: ${err.message}`);
  }
}

/**
 * Retrieves a revision state from Firestore.
 */
export async function getRevision(revisionId: string): Promise<Partial<RevisionState> | null> {
  if (!isCloudEnabled()) return null;

  const db = getFirestore();
  if (!db) return null;

  try {
    const fetchDoc = async () => {
      const doc = await db.collection(COLLECTION_REVISIONS).doc(revisionId).get();
      if (!doc.exists) {
        return null;
      }
      return doc.data() as Partial<RevisionState>;
    };

    return await withTimeout(fetchDoc(), 3000, null);
  } catch (err: any) {
    console.error(`[firestoreDb] Failed to get revision ${revisionId}: ${err.message}`);
    return null;
  }
}

/**
 * Hydrates a revision state, checking in-memory cache first,
 * falling back to Firestore on cache miss, and restoring into memory.
 */
export async function getOrHydrateRevision(revisionId: string): Promise<RevisionState | null> {
  if (!revisionId || typeof revisionId !== 'string') return null;

  // 1. Check in-memory cache first
  const cached = revisions.get(revisionId);
  if (cached) {
    return cached;
  }

  // 2. Fall back to Firestore
  try {
    const fetchFn = (exports && exports.getRevision) ? exports.getRevision : getRevision;
    const record = await fetchFn(revisionId);
    if (!record || !record.id || !record.status) {
      return null;
    }

    const hydrated: RevisionState = {
      id: record.id,
      status: record.status as RevisionState['status'],
      imageBase64: record.imageBase64,
      originalImagePath: record.originalImagePath,
      analysis: record.analysis,
      preferences: record.preferences,
      recommendations: record.recommendations,
      selectedHairstyleId: record.selectedHairstyleId,
      previewState: record.previewState,
      previewImageUrl: record.previewImageUrl,
      previewImagePath: record.previewImagePath,
      error: record.error,
    };

    // 3. Store restored state back in in-memory cache
    revisions.set(revisionId, hydrated);
    console.log(`[firestoreDb] Hydrated revision ${revisionId} from Firestore into in-memory cache`);
    return hydrated;
  } catch (err: any) {
    console.error(`[firestoreDb] Error hydrating revision ${revisionId}: ${err.message}`);
    return null;
  }
}

/**
 * Deletes a revision state from Firestore.
 */
export async function deleteRevision(revisionId: string): Promise<void> {
  if (!isCloudEnabled()) return;

  const db = getFirestore();
  if (!db) return;

  try {
    await withTimeout(
      db.collection(COLLECTION_REVISIONS).doc(revisionId).delete(),
      3000,
      null
    );
  } catch (err: any) {
    console.error(`[firestoreDb] Failed to delete revision ${revisionId}: ${err.message}`);
  }
}

/**
 * Diagnostic read-only connectivity check.
 * Safely verifies whether Firestore can be contacted without exposing secrets.
 */
export async function checkFirestoreConnection(): Promise<{
  enabled: boolean;
  connected: boolean;
  projectId?: string;
  message: string;
}> {
  if (!isCloudEnabled()) {
    return {
      enabled: false,
      connected: false,
      message: 'Cloud is not enabled (FIREBASE_PROJECT_ID not set)',
    };
  }

  const db = getFirestore();
  if (!db) {
    return {
      enabled: true,
      connected: false,
      projectId: process.env.FIREBASE_PROJECT_ID,
      message: 'Firestore client initialization failed',
    };
  }

  try {
    // Read-only probe with limit 1 and 2500ms timeout
    const snapshot = await withTimeout(
      db.collection(COLLECTION_REVISIONS).limit(1).get(),
      2500,
      null
    );

    if (!snapshot) {
      return {
        enabled: true,
        connected: false,
        projectId: process.env.FIREBASE_PROJECT_ID,
        message: 'Firestore connection timed out after 2500ms',
      };
    }

    return {
      enabled: true,
      connected: true,
      projectId: process.env.FIREBASE_PROJECT_ID,
      message: `Firestore connection successful. Revisions accessible (${snapshot.size} sample records verified).`,
    };
  } catch (err: any) {
    return {
      enabled: true,
      connected: false,
      projectId: process.env.FIREBASE_PROJECT_ID,
      message: `Firestore read failed: ${err.message}`,
    };
  }
}
