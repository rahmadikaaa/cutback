// In-memory state for MVP (T2/T3/T4)
export interface RevisionState {
  id: string;
  status: 'READY' | 'ANALYZED' | 'RECOMMENDATIONS_READY' | 'READY_FOR_PREVIEW' | 'STALE' | 'FAILED';
  imageBase64?: string;
  analysis?: any;
  preferences?: {
    vibe?: string;
    desiredLength?: string;
    stylingEffort?: string;
    note?: string;
  };
  recommendations?: any[];
  selectedHairstyleId?: string;
  previewState?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'STALE' | 'SKIPPED';
  previewImageUrl?: string;
  previewPromise?: Promise<any>;
  error?: string;
}

export const revisions = new Map<string, RevisionState>();
