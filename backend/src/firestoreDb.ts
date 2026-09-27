import { getFirestore, isCloudEnabled } from './firebase';
import type { RevisionState } from './state';

const COLLECTION_REVISIONS = 'revisions';

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
    await db.collection(COLLECTION_REVISIONS).doc(revisionId).set(docData, { merge: true });
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
    const doc = await db.collection(COLLECTION_REVISIONS).doc(revisionId).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as Partial<RevisionState>;
  } catch (err: any) {
    console.error(`[firestoreDb] Failed to get revision ${revisionId}: ${err.message}`);
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
    await db.collection(COLLECTION_REVISIONS).doc(revisionId).delete();
  } catch (err: any) {
    console.error(`[firestoreDb] Failed to delete revision ${revisionId}: ${err.message}`);
  }
}
