const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

export interface UploadResponse {
  status: 'success' | 'error'
  requestId?: string
  route: 'REUPLOAD' | 'CONSENT_REQUIRED' | 'READY_FOR_ANALYSIS'
  revisionId?: string
  message: string
}

export async function uploadPhoto(
  photoBlobOrFile: Blob | File,
  consent: boolean
): Promise<UploadResponse> {
  const formData = new FormData()

  const file =
    photoBlobOrFile instanceof File
      ? photoBlobOrFile
      : new File([photoBlobOrFile], 'photo.jpg', {
          type: photoBlobOrFile.type || 'image/jpeg',
        })

  formData.append('photo', file)
  formData.append('consent', consent ? 'true' : 'false')

  const response = await fetch(`${API_BASE}/api/upload`, {
    method: 'POST',
    body: formData,
  })

  const data = (await response.json()) as UploadResponse

  if (!response.ok && !data.route) {
    throw new Error(data.message || `Upload failed with status ${response.status}`)
  }

  return data
}

export interface AnalysisAttributes {
  hairLength: 'short' | 'medium' | 'long' | 'unknown'
  hairType: 'straight' | 'wavy' | 'curly' | 'coily' | 'unknown'
  hairThickness: 'fine' | 'medium' | 'thick' | 'unknown'
  hairLine: 'receding' | 'widow_peak' | 'straight' | 'unknown'
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'diamond' | 'oblong' | 'unknown'
}

export interface AnalysisData {
  visualSuitability: {
    isValid: boolean
    reason?: string
  }
  attributes?: AnalysisAttributes
}

export interface AnalyzeResponse {
  status: 'success' | 'error'
  requestId?: string
  route: 'SUCCESS' | 'REUPLOAD' | 'RETRY_REQUIRED' | 'STALE'
  analysis?: AnalysisData
  message: string
}

export async function analyzePhoto(revisionId: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revisionId }),
  })

  const data = (await response.json()) as AnalyzeResponse

  if (!response.ok && !data.route) {
    throw new Error(data.message || `Analysis failed with status ${response.status}`)
  }

  return data
}

export interface BackendRecommendationItem {
  id: string
  name: string
  description: string
  reason: string
  stylingEffort: 'low' | 'medium' | 'high'
  constraints: string[]
  isBestMatch: boolean
  bestMatchReason?: string
}

export interface RecommendationPreferencesInput {
  vibe?: string
  desiredLength?: string
  stylingEffort?: string
  note?: string
}

export interface RecommendationsResponse {
  status: 'success' | 'error'
  requestId?: string
  route: 'SUCCESS' | 'STALE' | 'RETRY_REQUIRED'
  recommendations?: {
    recommendations: BackendRecommendationItem[]
  }
  message: string
}

export async function fetchRecommendations(
  revisionId: string,
  preferences?: RecommendationPreferencesInput
): Promise<RecommendationsResponse> {
  const response = await fetch(`${API_BASE}/api/recommendations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      revisionId,
      preferences:
        preferences && Object.values(preferences).some(Boolean)
          ? preferences
          : undefined,
    }),
  })

  const data = (await response.json()) as RecommendationsResponse

  if (!response.ok && !data.route) {
    throw new Error(data.message || `Recommendations failed with status ${response.status}`)
  }

  return data
}

export interface SelectHairstyleResponse {
  status: 'success' | 'error'
  route?: 'READY_FOR_PREVIEW'
  selectedHairstyleId?: string
  message?: string
}

export async function selectHairstyle(
  revisionId: string,
  hairstyleId: string
): Promise<SelectHairstyleResponse> {
  const response = await fetch(`${API_BASE}/api/select`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revisionId, hairstyleId }),
  })

  const data = (await response.json()) as SelectHairstyleResponse

  if (!response.ok && !data.route) {
    throw new Error(data.message || `Failed to select hairstyle (${response.status})`)
  }

  return data
}

export interface PreviewResponse {
  status: 'success' | 'error'
  requestId?: string
  route: 'SUCCESS' | 'STALE' | 'RETRY_REQUIRED' | 'FAILED'
  message: string
  previewImageUrl?: string
}

export async function generatePreview(
  revisionId: string,
  hairstyleId: string
): Promise<PreviewResponse> {
  const response = await fetch(`${API_BASE}/api/preview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ revisionId, hairstyleId }),
  })

  const data = (await response.json()) as PreviewResponse

  if (!response.ok && !data.route) {
    throw new Error(data.message || `Preview generation failed (${response.status})`)
  }

  return data
}
