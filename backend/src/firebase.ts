/**
 * firebase.ts — Firebase Admin SDK singleton (v14 modular API)
 *
 * Lazy-initialized once per process. Safe to import in every module.
 * When FIREBASE_PROJECT_ID is not set (local dev without cloud), all
 * methods return null and callers fall back gracefully without crashing.
 *
 * In Cloud Run: Application Default Credentials are used automatically.
 * Locally with cloud: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key path.
 */

import { initializeApp, getApps, applicationDefault, type App, type AppOptions } from 'firebase-admin/app';
import { getFirestore as _getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage as _getStorage, type Storage } from 'firebase-admin/storage';

let _initialized = false;
let _app: App | null = null;
let _db: Firestore | null = null;
let _storage: Storage | null = null;

function initFirebase(): App | null {
  if (_initialized) return _app;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    // Local dev without cloud: silently skip
    _initialized = true;
    return null;
  }

  try {
    if (getApps().length > 0) {
      _app = getApps()[0];
      _initialized = true;
      return _app;
    }

    const options: AppOptions = {
      credential: applicationDefault(),
      projectId,
    };
    const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
    if (storageBucket) {
      options.storageBucket = storageBucket;
    }

    _app = initializeApp(options);
    _initialized = true;
    console.log(`[firebase] Initialized Firebase Admin for project: ${projectId}`);
    return _app;
  } catch (err: any) {
    // Don't crash the server if Firebase can't init (missing ADC creds in local dev)
    console.warn(`[firebase] Firebase Admin init skipped: ${err.message}`);
    _initialized = true;
    return null;
  }
}

export function getFirestore(): Firestore | null {
  if (_db) return _db;
  const app = initFirebase();
  if (!app) return null;
  try {
    _db = _getFirestore(app);
    return _db;
  } catch (err: any) {
    console.warn(`[firebase] getFirestore failed: ${err.message}`);
    return null;
  }
}

export function getStorage(): Storage | null {
  if (_storage) return _storage;
  const app = initFirebase();
  if (!app) return null;
  try {
    _storage = _getStorage(app);
    return _storage;
  } catch (err: any) {
    console.warn(`[firebase] getStorage failed: ${err.message}`);
    return null;
  }
}

export function isCloudEnabled(): boolean {
  return !!process.env.FIREBASE_PROJECT_ID;
}
