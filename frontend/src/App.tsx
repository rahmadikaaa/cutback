import { useState, useEffect, useRef } from 'react'
import portrait1 from './assets/portrait-1.jpg'
import portrait2 from './assets/portrait-2.png'
import portrait3 from './assets/portrait-3.png'
import calmStudioSelfie from './assets/Calm Studio Selfie Portrait.png'
import blackCapSelfie from './assets/Black Cap Selfie Portrait.png'
import {
  uploadPhoto,
  analyzePhoto,
  fetchRecommendations,
  selectHairstyle,
  generatePreview,
  type AnalysisData,
  type BackendRecommendationItem,
  type RecommendationPreferencesInput,
} from './api'
import { get, set } from 'idb-keyval'
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision'

// ── Types ─────────────────────────────────────────────────────────────────

type Screen =
  | 'home'
  | 'upload'
  | 'analysis-loading'
  | 'analysis-failure'
  | 'analysis-results'
  | 'preferences'
  | 'recommendations'
  | 'customize-look'
  | 'preview-loading'
  | 'preview-failure'
  | 'preview'
  | 'barber-brief'
  | 'save'
  | 'save-success'
  | 'save-failure'
  | 'my-haircuts'

interface Prefs {
  vibe: string
  length: string
  effort: string
  notes: string
}

interface SavedHaircut {
  id: string
  name: string
  date: string
  hairstyleId: number
  backendId?: string
  hairstyleName?: string
  previewImageUrl?: string
  rec?: HairstyleItem
  originalPhotoUrl?: string
  originalPhotoBlob?: Blob
}

// ── Data ──────────────────────────────────────────────────────────────────

export interface ReasonEvidenceDisplayItem {
  obs: string
  contribution: string
  source?: 'Observed' | 'Inferred' | 'User-provided' | 'Unknown'
  attribute?: string
  value?: string
}

export interface HairstyleItem {
  id: number
  backendId?: string
  name: string
  description: string
  reason: string
  reasonEvidence: ReasonEvidenceDisplayItem[]
  effort: string
  effortDetail: string
  limitation: string
  bestMatch: boolean
  bestMatchReason?: string
  constraints?: string[]
  feasibility?: 'Ready Now' | 'Possible with Adjustment' | 'Transition Required' | 'Not Currently Realistic'
  transitionGuidance?: string
  barberBrief?: {
    top?: string
    sides?: string
    back?: string
    fringe?: string
    styling?: string
    maintenance?: string
    preserve?: string
    avoid?: string
  }
  previewPortrait: string
  top: string
  sides: string
  back: string
  fade: string
  styling: string
}

function extractValue(attr: any): string {
  if (!attr) return 'unknown'
  return typeof attr === 'string' ? attr : attr.value
}

function extractSource(attr: any): string {
  if (!attr) return 'Unknown'
  return typeof attr === 'string' ? 'Unknown' : attr.source
}

export function cleanCanonicalHaircutName(name: string, userNote?: string): string {
  if (!name) return name
  let cleaned = name.trim()

  if (userNote && userNote.trim()) {
    const rawNote = userNote.trim()
    const escaped = rawNote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    cleaned = cleaned.replace(new RegExp(`\\s*(?:[(-/:]\\s*)*\\b${escaped}\\b\\s*[)]?`, 'gi'), '').trim()
  }

  cleaned = cleaned.replace(/\s*\((?:cepak|buzz\s*cut|pendek|rapirapi|spiky|undercut|fade|taper|side\s*part|quiff)\)/gi, '').trim()
  cleaned = cleaned.replace(/[\s\-_:/(]+$/, '').trim()

  return cleaned || name.trim()
}

function mapBackendRecommendations(
  items: BackendRecommendationItem[],
  analysisData: AnalysisData | null,
  prefs: Prefs
): HairstyleItem[] {
  const portraits = [portrait2, portrait3, portrait1]

  return items.map((rec, index) => {
    const effortCapitalized = rec.stylingEffort
      ? rec.stylingEffort.charAt(0).toUpperCase() + rec.stylingEffort.slice(1)
      : 'Medium'

    const effortDetail =
      rec.stylingEffort === 'low'
        ? 'Air-dry or minimal styling'
        : rec.stylingEffort === 'high'
          ? '10–15 min — fully styled with product'
          : '5–10 min — light hold product'

    const limitation =
      rec.constraints && rec.constraints.length > 0
        ? rec.constraints.join('. ')
        : 'Requires regular maintenance cuts'

    const userNote = (prefs as any)?.notes || (prefs as any)?.note || ''
    const evidence: ReasonEvidenceDisplayItem[] = []

    if (rec.reasonEvidence && Array.isArray(rec.reasonEvidence) && rec.reasonEvidence.length > 0) {
      for (const item of rec.reasonEvidence as any[]) {
        if (item.obs && !item.attribute) {
          // Backward compatibility for legacy test fixtures with { obs, contribution }
          evidence.push({
            obs: item.obs,
            contribution: item.contribution || '',
            source: item.source || 'Observed',
          })
          continue
        }

        const attr = item.attribute || ''
        const val = item.value || ''
        let obsLabel = `${val} ${attr.toLowerCase()}`.trim()
        if (item.source === 'Inferred') {
          obsLabel = `${val} ${attr.toLowerCase()}`.trim()
        } else if (item.source === 'User-provided') {
          obsLabel = `Preference: ${val}`
        } else if (item.source === 'Unknown') {
          obsLabel = `${attr} (undetermined)`
        }

        evidence.push({
          obs: obsLabel || val || attr || 'Aligned feature',
          contribution: item.contribution || '',
          source: item.source,
          attribute: item.attribute,
          value: item.value,
        })
      }
    } else {
      // Fallback: derive grounded evidence from analysisData and preferences
      const faceVal = extractValue(analysisData?.attributes?.faceShape)
      const faceSrc = extractSource(analysisData?.attributes?.faceShape) as 'Observed' | 'Inferred' | 'User-provided' | 'Unknown'
      if (faceVal !== 'unknown') {
        const valCap = faceVal.charAt(0).toUpperCase() + faceVal.slice(1)
        evidence.push({
          obs: `${valCap} face`,
          contribution: faceSrc === 'Inferred'
            ? 'likely proportions naturally framed by this cut'
            : 'proportions naturally framed by this cut',
          source: faceSrc,
          attribute: 'Face Shape',
          value: valCap,
        })
      }

      const hairVal = extractValue(analysisData?.attributes?.hairType)
      const hairSrc = extractSource(analysisData?.attributes?.hairType) as 'Observed' | 'Inferred' | 'User-provided' | 'Unknown'
      if (hairVal !== 'unknown') {
        const valCap = hairVal.charAt(0).toUpperCase() + hairVal.slice(1)
        evidence.push({
          obs: `${valCap} pattern`,
          contribution: hairSrc === 'Inferred'
            ? 'appears to work with natural movement'
            : 'works with natural movement',
          source: hairSrc,
          attribute: 'Hair Pattern',
          value: valCap,
        })
      }

      if (userNote && userNote.trim()) {
        evidence.push({
          obs: `Preference: ${userNote.trim()}`,
          contribution: 'personal preference guiding shorter, clean profile',
          source: 'User-provided',
          attribute: 'User Preference',
          value: userNote.trim(),
        })
      }
    }

    if (evidence.length === 0) {
      evidence.push({
        obs: 'Feature alignment',
        contribution: 'harmonises with your facial structure',
        source: 'Observed',
      })
    }

    const canonicalName = cleanCanonicalHaircutName(rec.name, userNote)

    return {
      id: index,
      backendId: rec.id,
      name: canonicalName,
      description: rec.description,
      reason: rec.reason,
      reasonEvidence: evidence,
      effort: effortCapitalized,
      effortDetail,
      limitation,
      bestMatch: rec.isBestMatch,
      bestMatchReason: rec.bestMatchReason,
      constraints: rec.constraints,
      feasibility: rec.feasibility,
      transitionGuidance: rec.transitionGuidance,
      barberBrief: rec.barberBrief,
      previewPortrait: portraits[index % portraits.length],
      top: 'Customised length and texture for your hair',
      sides: 'Clean tapered finish to balance proportion',
      back: 'Tapered neckline to match overall shape',
      fade: 'Tailored transition suited to face structure',
      styling: `${effortCapitalized} effort: styling paste or light clay recommended`,
    }
  })
}

export const DEMO_FIXTURE_HAIRSTYLES: HairstyleItem[] = [
  {
    id: 0,
    name: 'Textured Quiff',
    description: 'Volume on top with natural, textured styling',
    reason: 'Works with your visible natural volume and wave pattern. The texture enhances what\'s already there rather than fighting it.',
    reasonEvidence: [
      { obs: 'Natural wave', contribution: 'texture works with your wave, not against it' },
      { obs: 'Moderate volume', contribution: 'existing lift supports the quiff shape' },
      { obs: 'Short-medium length', contribution: 'right starting length for this cut' },
    ],
    effort: 'Medium',
    effortDetail: '10–15 min — texturizing paste, light blow-dry',
    limitation: 'Requires regular styling and a quality texturizing product to hold throughout the day',
    bestMatch: true,
    previewPortrait: portrait2,
    top: 'Medium length, textured and lifted',
    sides: 'Short, tapered — scissor finish',
    back: 'Tapered to match sides, clean neckline',
    fade: 'Low fade — begins above the ear line',
    styling: 'Texturizing paste, medium hold, light shine',
  },
  {
    id: 1,
    name: 'Side Part',
    description: 'Classic structured parting with clean, sharp lines',
    reason: 'Complements your oval face shape well. Supports the fresh, clean direction and reads as polished without needing heavy product.',
    reasonEvidence: [
      { obs: 'Oval face shape', contribution: 'structure frames your face proportionally' },
      { obs: 'Fine-medium texture', contribution: 'lies flat easily for a clean part' },
      { obs: 'Short-medium length', contribution: 'enough length to establish the parting' },
    ],
    effort: 'Medium',
    effortDetail: '5–10 min — light hold product, side comb',
    limitation: 'Works best with straighter hair — your wave may need a small amount of smoothing',
    bestMatch: false,
    previewPortrait: portrait3,
    top: 'Medium length, combed and parted to one side',
    sides: 'Short, scissor-cut, blended',
    back: 'Clean taper, matches sides',
    fade: 'Low-medium taper — natural finish',
    styling: 'Light pomade or clay, medium hold',
  },
  {
    id: 2,
    name: 'Low Taper + Volume',
    description: 'Tapered sides with natural volume kept on top',
    reason: 'Compatible with your current length. Lower maintenance than the Quiff while still looking intentional and sharp.',
    reasonEvidence: [
      { obs: 'Moderate volume', contribution: 'natural volume carries the top without effort' },
      { obs: 'Short-medium length', contribution: 'minimal change — works with what you have' },
      { obs: 'Natural wave', contribution: 'wave adds organic texture at low maintenance' },
    ],
    effort: 'Low',
    effortDetail: 'Air-dry or 5 min — volumizing spray optional',
    limitation: 'Less dramatic visual change from your current look — good for a first change',
    bestMatch: false,
    previewPortrait: portrait2,
    top: 'Medium length, natural volume and movement',
    sides: 'Low taper, skin-to-short blend',
    back: 'Taper to match sides, clean line',
    fade: 'Low taper — starts mid-ear',
    styling: 'Minimal — air-dry or light volumizer',
  },
]

const ANALYSIS_STEPS = [
  'Preparing your photo',
  'Reading visible features',
  'Understanding your hair',
  'Building your recommendations',
]

export const DEMO_FIXTURE_ANALYSIS_OBS = [
  { label: 'Face shape', value: 'Oval', source: 'Observed' },
  { label: 'Hair pattern', value: 'Natural wave', source: 'Observed' },
  { label: 'Current length', value: 'Short-medium', source: 'Observed' },
  { label: 'Volume', value: 'Moderate', source: 'Observed' },
  { label: 'Hair thickness', value: 'Unknown', source: 'Unknown' },
  { label: 'Texture', value: 'Fine-medium', source: 'Observed' },
]

const VIBES = ['Fresh', 'Classic', 'Bold', 'Natural', 'Low-key']
const LENGTHS = ['Shorter', 'Keep current', 'Slightly longer']
const EFFORTS = [
  { id: 'low', label: 'Low', detail: 'Air-dry' },
  { id: 'medium', label: 'Medium', detail: '5–10 min' },
  { id: 'high', label: 'High', detail: 'Fully styled' },
]

// ── Shared UI ─────────────────────────────────────────────────────────────

function SimBadge({ label = 'Simulated AI' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium tracking-wide"
      style={{
        background: 'rgba(201,169,110,0.12)',
        color: '#c9a96e',
        border: '1px solid rgba(201,169,110,0.28)',
        letterSpacing: '0.07em',
        textTransform: 'uppercase',
      }}
    >
      ◦ {label}
    </span>
  )
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      aria-label="Go back"
      className="flex items-center justify-center rounded-full flex-shrink-0 transition-all active:scale-90"
      style={{ background: 'rgba(240,235,224,0.09)', width: 44, height: 44, border: '1px solid rgba(240,235,224,0.1)' }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.5 5L7.5 10L12.5 15" stroke="#f0ebe0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

function ProgressDots({ total, active, chosen }: { total: number; active: number; chosen: number | null }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isFaded = chosen !== null && i !== chosen
        return (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === active ? 20 : 6,
              height: 6,
              background: i === active ? '#c9a96e' : 'rgba(240,235,224,0.35)',
              opacity: isFaded ? 0.28 : 1,
            }}
          />
        )
      })}
    </div>
  )
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-medium text-base transition-all active:scale-[0.98] ${className}`}
      style={{
        background: disabled ? 'rgba(201,169,110,0.28)' : '#c9a96e',
        color: disabled ? 'rgba(8,12,20,0.45)' : '#080c14',
        minHeight: 56,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </button>
  )
}

function GhostBtn({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full py-3.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98] ${className}`}
      style={{
        background: 'var(--secondary)',
        color: 'var(--foreground)',
        border: '1px solid var(--border)',
        minHeight: 48,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {children}
    </button>
  )
}

// ── HomeScreen ─────────────────────────────────────────────────────────────

function HomeScreen({ onStart, onMyHaircuts }: { onStart: () => void; onMyHaircuts: () => void }) {
  const [phase, setPhase] = useState(0)
  const [isJourneyMinimized, setIsJourneyMinimized] = useState(false)
  const journeyRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const t = setInterval(() => setPhase(p => (p + 1) % 3), 2800)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (isJourneyMinimized) return

    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (journeyRef.current && !journeyRef.current.contains(event.target as Node)) {
        setIsJourneyMinimized(true)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isJourneyMinimized])

  const transformWords = ['sharper', 'bolder', 'cleaner']

  return (
    <div className="screen-enter min-h-dvh flex flex-col relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: '#0b1728' }}>
        <img src={portrait2} alt="" aria-hidden className="h-[92%] w-full object-cover object-top" />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.28) 0%, rgba(8,12,20,0.06) 22%, rgba(8,12,20,0.72) 58%, rgba(8,12,20,0.98) 100%)' }}
        />
      </div>

      <div className="relative flex flex-col flex-1 px-6 pt-14 pb-10 justify-between">
        {/* Brand mark */}
        <div>
          <p className="text-xs tracking-[0.26em] uppercase mb-3" style={{ color: '#c9a96e', letterSpacing: '0.22em' }}>Cutback</p>
        </div>

        {/* Transformation journey */}
        <aside
          ref={journeyRef}
          className={`absolute right-0 top-[162px] overflow-hidden rounded-l-xl border-l transition-[width] duration-[240ms] ease-out ${isJourneyMinimized ? 'w-[68px]' : 'w-[142px]'
            }`}
          aria-label="Transformation journey"
          style={{
            background: isJourneyMinimized ? 'transparent' : 'linear-gradient(90deg, rgba(8,12,20,0.5), rgba(8,12,20,0.86))',
            borderColor: isJourneyMinimized ? 'transparent' : 'rgba(201,169,110,0.18)',
            backdropFilter: isJourneyMinimized ? 'none' : 'blur(3px)',
          }}
        >
          <button
            type="button"
            className={`block w-full ${isJourneyMinimized ? 'py-1' : 'px-3 pb-2 pt-3 text-left'}`}
            onClick={() => {
              if (isJourneyMinimized) {
                setIsJourneyMinimized(false)
              }
            }}
            aria-expanded={!isJourneyMinimized}
            aria-label={isJourneyMinimized ? 'Expand Transformation Journey' : 'Transformation Journey'}
          >
            {isJourneyMinimized ? (
              <span className="block w-full">
                <span
                  className="mb-2 block px-0.5 text-center text-[7.5px] font-medium uppercase leading-[1.25]"
                  style={{
                    color: 'rgba(240,235,224,0.65)',
                    letterSpacing: '0.06em',
                    textShadow: '0 1px 4px rgba(8,12,20,0.9)',
                  }}
                >
                  Transformation
                  <br />
                  Journey
                </span>
                {[
                  { number: '01', label: 'Discover' },
                  { number: '02', label: 'Define' },
                  { number: '03', label: 'Visualize' },
                  { number: '04', label: 'Ready' },
                ].map((step, i) => {
                  const isActive = i === 0
                  return (
                    <span key={step.number} className="relative flex h-12 w-full flex-col items-center">
                      <span
                        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-semibold"
                        style={{
                          background: isActive ? '#c9a96e' : 'rgba(8,12,20,0.58)',
                          border: isActive ? '1px solid #c9a96e' : '1px solid rgba(240,235,224,0.46)',
                          color: isActive ? '#080c14' : 'rgba(240,235,224,0.7)',
                          boxShadow: isActive ? '0 0 7px rgba(201,169,110,0.18)' : 'none',
                        }}
                      >
                        {step.number}
                      </span>
                      <span
                        className="relative z-10 mt-0.5 block text-center text-[10px] font-medium leading-4"
                        style={{ color: '#f0ebe0', textShadow: '0 1px 5px rgba(8,12,20,0.9)' }}
                      >
                        {step.label}
                      </span>
                      {i < 3 && (
                        <span
                          className="absolute left-1/2 top-[38px] h-[10px] w-px -translate-x-1/2"
                          style={{ background: 'rgba(240,235,224,0.32)' }}
                          aria-hidden
                        />
                      )}
                    </span>
                  )
                })}
              </span>
            ) : (
              <span className="block w-[118px]">
                <span
                  className="mb-3 block text-[10px] font-medium uppercase leading-[1.35]"
                  style={{ color: 'rgba(240,235,224,0.62)', letterSpacing: '0.16em' }}
                >
                  Transformation
                  <br />
                  Journey
                </span>
                <span className="block">
                  {[
                    { number: '01', label: 'Discover', detail: 'Upload & Analyse' },
                    { number: '02', label: 'Define', detail: 'Recommend' },
                    { number: '03', label: 'Visualize', detail: 'Preview' },
                    { number: '04', label: 'Ready', detail: 'Brief' },
                  ].map((step, i) => {
                    const isActive = i === 0
                    return (
                      <span key={step.number} className="relative flex min-h-[44px] gap-2.5">
                        <span className="relative flex w-[22px] flex-shrink-0 justify-center">
                          <span
                            className="relative z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full text-[8px] font-semibold"
                            style={{
                              background: isActive ? '#c9a96e' : 'rgba(8,12,20,0.34)',
                              border: isActive ? '1px solid #c9a96e' : '1px solid rgba(240,235,224,0.4)',
                              color: isActive ? '#080c14' : 'rgba(240,235,224,0.62)',
                              boxShadow: isActive ? '0 0 8px rgba(201,169,110,0.2)' : 'none',
                            }}
                          >
                            {step.number}
                          </span>
                          {i < 3 && (
                            <span
                              className="absolute top-[22px] h-[22px] w-px"
                              style={{ background: 'rgba(240,235,224,0.24)' }}
                              aria-hidden
                            />
                          )}
                        </span>
                        <span className="-mt-0.5 block min-w-0">
                          <span className="block text-xs font-semibold leading-[17px]" style={{ color: '#f0ebe0' }}>{step.label}</span>
                          <span className="block whitespace-nowrap text-[10px] leading-[15px]" style={{ color: 'rgba(240,235,224,0.58)' }}>
                            {step.detail}
                          </span>
                        </span>
                      </span>
                    )
                  })}
                </span>
              </span>
            )}
          </button>
        </aside>

        {/* Hero */}
        <div>
          <div className="mb-6">
            <h1 className="font-display leading-[1.02]" style={{ color: '#f0ebe0', fontSize: 52 }}>
              A{' '}
              <span
                key={phase}
                className="hero-word-enter"
                style={{ color: '#c9a96e', display: 'inline-block' }}
              >
                {transformWords[phase]}
              </span>
              <br />
              you.
            </h1>
          </div>

          <p className="text-sm mb-2 leading-relaxed" style={{ color: 'rgba(240,235,224,0.7)', maxWidth: 300 }}>
            Find a haircut grounded in your features. Preview it on yourself. Take a clear brief to your barber.
          </p>
          <p className="text-xs mb-8" style={{ color: 'rgba(240,235,224,0.38)', letterSpacing: '0.06em' }}>
            Identity stays. Hair transforms.
          </p>

          <PrimaryBtn onClick={onStart}>Make It Real</PrimaryBtn>
          <div className="mt-3">
            <GhostBtn onClick={onMyHaircuts}>My Haircuts</GhostBtn>
          </div>
          <p className="text-center text-xs mt-6" style={{ color: 'rgba(240,235,224,0.22)', letterSpacing: '0.06em' }}>
            Your best haircut, remembered.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── UploadScreen ───────────────────────────────────────────────────────────

function UploadScreen({
  onBack, consent, setConsent, selectedPhoto, setSelectedPhoto, onContinue, onUploadSuccess,
}: {
  onBack: () => void
  consent: boolean
  setConsent: (v: boolean) => void
  selectedPhoto: string | null
  setSelectedPhoto: (v: string | null) => void
  onContinue: () => void
  onUploadSuccess: (revisionId: string, normalizedUrl?: string) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const samples = [portrait1, portrait2, portrait3]

  async function handleContinue() {
    if (!selectedPhoto) { setError('Please select or upload a photo to continue.'); return }
    if (!consent) { setError('Please agree to photo processing to continue.'); return }
    setError(null)
    setIsUploading(true)

    try {
      let fileToSend: Blob | File | null = selectedFile
      if (!fileToSend && selectedPhoto) {
        const fetchRes = await fetch(selectedPhoto)
        fileToSend = await fetchRes.blob()
      }

      if (!fileToSend) {
        setError('Unable to prepare photo for upload.')
        setIsUploading(false)
        return
      }

      const { blob: normalizedBlob, url: normalizedUrl } = await normalizePhoto(fileToSend);

      const result = await uploadPhoto(fileToSend, consent)

      if (result.route === 'READY_FOR_ANALYSIS' && result.revisionId) {
        onUploadSuccess(result.revisionId, normalizedUrl)
        onContinue()
      } else if (result.route === 'CONSENT_REQUIRED') {
        setError(result.message || 'Consent is required for AI processing.')
      } else if (result.route === 'REUPLOAD') {
        setError(result.message || 'File must be a valid image (JPEG, PNG, WebP) under 10MB.')
      } else {
        setError(result.message || 'Upload failed. Please try again.')
      }
    } catch (err: any) {
      setError(err.message || 'Network error connecting to backend service.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 px-4 pt-3 pb-1 flex-shrink-0">
        <BackBtn onBack={onBack} />
        <div>
          <h2 className="font-display text-xl" style={{ color: 'var(--foreground)' }}>Take Your Photo</h2>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Capture your hair clearly</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-2 flex flex-col gap-2.5">
        {/* Photo guidance */}
        <div className="rounded-xl px-3 py-2" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: '#c9a96e' }}>Photo Guide</p>
          <ul className="text-xs space-y-0.5" style={{ color: 'var(--secondary-foreground)' }}>
            {[
              'One person, facing forward',
              'Show your full hair (top, sides, front)',
              'Good lighting',
              'No hat, no sunglasses',
              'Use a recent photo'
            ].map(g => (
              <li key={g} className="flex gap-2 items-start">
                <span className="mt-1" style={{ color: 'rgba(201,169,110,0.5)', fontSize: '8px' }}>●</span> <span className="leading-snug">{g}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Example section */}
        <div className={selectedPhoto ? "hidden" : "block"}>
          <p className="text-[9px] uppercase font-bold tracking-widest mb-1.5" style={{ color: 'var(--muted-foreground)' }}>Example</p>
          <div className="flex gap-2 px-3">
            {/* GOOD */}
            <div className="flex-1">
              <div className="relative rounded-xl overflow-hidden mb-1" style={{ aspectRatio: '3/4', border: '1px solid rgba(240,235,224,0.1)' }}>
                <img src={calmStudioSelfie} alt="Good example" className="w-full h-full object-cover object-top scale-[1.25] origin-[50%_10%]" />
                <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#4caf50', border: '1px solid rgba(8,12,20,0.4)' }}>
                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#080c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
              <p className="text-[9px] font-bold tracking-wider mb-0" style={{ color: '#4caf50' }}>GOOD</p>
              <ul className="text-[9px] space-y-0 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                <li>Face facing forward</li>
                <li>Full hair visible</li>
                <li>Hair is not covered</li>
                <li>Good lighting</li>
              </ul>
            </div>

            {/* BAD */}
            <div className="flex-1">
              <div className="relative rounded-xl overflow-hidden mb-1" style={{ aspectRatio: '3/4', border: '1px solid rgba(240,235,224,0.1)' }}>
                <img src={blackCapSelfie} alt="Bad example" className="w-full h-full object-cover object-top opacity-50 grayscale scale-[1.25] origin-[50%_10%]" />
                <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#e57373', border: '1px solid rgba(8,12,20,0.4)' }}>
                  <svg className="w-2 h-2" viewBox="0 0 12 12" fill="none"><path d="M3 3L9 9M9 3L3 9" stroke="#080c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </div>
              <p className="text-[9px] font-bold tracking-wider mb-0" style={{ color: '#e57373' }}>BAD</p>
              <ul className="text-[9px] space-y-0 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                <li>Hair covered</li>
                <li>Poor framing / hair not visible</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedFile(file)
              setSelectedPhoto(URL.createObjectURL(file))
              setError(null)
            }
          }}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="user"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) {
              setSelectedFile(file)
              setSelectedPhoto(URL.createObjectURL(file))
              setError(null)
            }
          }}
        />

        {/* Buttons (Before Upload) */}
        <div className={`flex gap-2 w-full ${selectedPhoto ? 'hidden' : 'flex'}`}>
          <button
            onClick={() => cameraRef.current?.click()}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] min-h-[40px]"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            Take Photo
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.98] min-h-[40px]"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
          >
            Gallery
          </button>
        </div>

        {/* Preview if selected */}
        {selectedPhoto && (
          <div className="flex flex-col">
            <p className="text-[9px] uppercase font-bold tracking-widest mb-1.5 text-center" style={{ color: 'var(--muted-foreground)' }}>Your Photo</p>
            <div className="w-full max-w-[240px] mx-auto rounded-xl overflow-hidden aspect-[4/5]" style={{ border: '1px solid var(--border)' }}>
              <img src={selectedPhoto} alt="Selected photo" className="w-full h-full object-cover object-center" />
            </div>

            {/* Change Photo */}
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => cameraRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
                style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Retake
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-[0.98]"
                style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              >
                Gallery
              </button>
            </div>
          </div>
        )}

        {/* Consent */}
        <div
          className="rounded-xl px-3 py-2"
          style={{ background: 'var(--secondary)', border: error && !consent ? '1px solid rgba(229,115,115,0.45)' : '1px solid var(--border)' }}
        >
          <label className="flex gap-2 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0" onClick={() => { setConsent(!consent); setError(null) }}>
              <div
                className="checkbox-inner w-4 h-4 rounded flex items-center justify-center"
                style={{
                  background: consent ? '#c9a96e' : 'transparent',
                  border: consent ? '2px solid #c9a96e' : '2px solid rgba(240,235,224,0.28)',
                }}
              >
                {consent && (
                  <svg className="w-2 h-2" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5L4.5 8L9 3" stroke="#080c14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div onClick={() => { setConsent(!consent); setError(null) }}>
              <p className="text-[11px] font-medium mb-0.5" style={{ color: 'var(--foreground)' }}>I agree to photo processing</p>
              <p className="text-[9px] leading-snug" style={{ color: 'var(--muted-foreground)' }}>
                Your photo is used only for haircut recommendations and your personal preview. It is not shared publicly or used for model training.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#e57373' }}>
            <span>⚠</span> {error}
          </p>
        )}

        <div className="pb-2">
          <PrimaryBtn onClick={handleContinue} disabled={!selectedPhoto || !consent || isUploading}>
            {isUploading ? 'Uploading & Validating…' : 'Continue'}
          </PrimaryBtn>
        </div>
      </div>
    </div>
  )
}

// ── AnalysisLoadingScreen ──────────────────────────────────────────────────

function AnalysisLoadingScreen({
  photo,
  revisionId,
  onComplete,
  onFail,
}: {
  photo: string
  revisionId: string | null
  onComplete: (data: AnalysisData) => void
  onFail: (errorMessage?: string) => void
}) {
  const [step, setStep] = useState(0)
  const isMountedRef = useRef(true)
  const executedRevisionRef = useRef<string | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const onFailRef = useRef(onFail)
  onFailRef.current = onFail

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(prev => (prev < ANALYSIS_STEPS.length - 1 ? prev + 1 : prev))
    }, 1100)

    async function executeAnalysis() {
      if (!revisionId) {
        onFailRef.current('No photo revision found. Please upload a photo first.')
        return
      }

      // Deduplication guard for React StrictMode double-mounting (DEF-001)
      if (executedRevisionRef.current === revisionId) {
        return
      }
      executedRevisionRef.current = revisionId

      try {
        const res = await analyzePhoto(revisionId)

        if (!isMountedRef.current) return

        if (res.route === 'SUCCESS' && res.analysis) {
          onCompleteRef.current(res.analysis)
        } else if (res.route === 'REUPLOAD') {
          onFailRef.current(res.message || 'Photo was not suitable for analysis. Please upload a clearer photo.')
        } else if (res.route === 'RETRY_REQUIRED') {
          onFailRef.current(res.message || 'Analysis temporarily failed. Please retry.')
        } else {
          onFailRef.current(res.message || 'Analysis could not be completed.')
        }
      } catch (err: any) {
        if (!isMountedRef.current) return
        onFailRef.current(err.message || 'Network error connecting to analysis service.')
      }
    }

    executeAnalysis()

    return () => {
      clearInterval(interval)
    }
  }, [revisionId])

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Hero Photo Container */}
      <div className="relative flex-shrink-0" style={{ height: '58vh', padding: '24px 20px 0 20px' }}>
        <div className="relative w-full h-full rounded-[24px] overflow-hidden" style={{ border: '1px solid rgba(240,235,224,0.06)' }}>
          <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
          {/* Subtle gradient only at the very bottom */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 80%, rgba(8,12,20,0.9) 100%)' }} />

          {/* Integrated AI Badge */}
          <div className="absolute top-5 left-5" style={{ backdropFilter: 'blur(8px)' }}>
            <SimBadge label="AI Analysis" />
          </div>
        </div>
      </div>

      {/* Analysis Timeline */}
      <div className="flex-1 px-7 pt-10 pb-8 flex flex-col">
        <div className="space-y-4 flex-1">
          {ANALYSIS_STEPS.map((s, i) => {
            const isCompleted = i < step
            const isActive = i === step
            const isPending = i > step

            return (
              <div key={i} className="flex items-center gap-4 transition-all duration-500" style={{ opacity: isPending ? 0.25 : 1 }}>
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  {isCompleted ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L4.5 8.5L10 3" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }} />
                    </svg>
                  ) : isActive ? (
                    <div className="relative w-3.5 h-3.5 flex items-center justify-center">
                       <div className="absolute w-full h-full rounded-full" style={{ background: 'rgba(201,169,110,0.25)', animation: 'dotPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
                       <div className="absolute w-1.5 h-1.5 rounded-full" style={{ background: '#c9a96e' }} />
                    </div>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--muted-foreground)' }} />
                  )}
                </div>
                <span className="text-[15px] transition-all duration-500" style={{
                  color: isActive ? '#f0ebe0' : 'rgba(240,235,224,0.5)',
                  fontWeight: isActive ? 500 : 400,
                  transform: isActive ? 'translateX(2px)' : 'none',
                  letterSpacing: '0.01em'
                }}>{s}</span>
              </div>
            )
          })}
        </div>
        {/* Contextual Line */}
        <div className="text-center mt-auto pt-6">
          <p className="text-xs" style={{ color: 'rgba(240,235,224,0.4)', letterSpacing: '0.02em' }}>
            Finding styles that work with your hair, face, and preferences.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── AnalysisFailureScreen ─────────────────────────────────────────────────

function AnalysisFailureScreen({
  photo,
  errorMessage,
  onRetry,
  onBack,
}: {
  photo: string
  errorMessage?: string | null
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
      <BackBtn onBack={onBack} />
      <div className="flex-1 flex flex-col items-center text-center pt-10">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(229,115,115,0.12)', border: '2px solid rgba(229,115,115,0.35)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 9v7M14 19.5v.5" stroke="#e57373" strokeWidth="2" strokeLinecap="round" /><circle cx="14" cy="14" r="11" stroke="#e57373" strokeWidth="1.5" /></svg>
        </div>
        <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--foreground)' }}>Analysis failed</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
          {errorMessage || 'Something went wrong. Your photo is safely preserved — you can try again or replace it.'}
        </p>
        <div className="w-24 h-24 rounded-xl overflow-hidden mb-5">
          <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
        </div>
        <SimBadge label="AI Analysis" />
      </div>
      <div className="space-y-3">
        <PrimaryBtn onClick={onRetry}>Retry Analysis</PrimaryBtn>
        <GhostBtn onClick={onBack}>Replace Photo</GhostBtn>
      </div>
    </div>
  )
}

// ── AnalysisResultsScreen ─────────────────────────────────────────────────

function formatAttrValue(val?: string) {
  if (!val || val === 'unknown') return 'Unknown'
  return val
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function AnalysisResultsScreen({
  photo,
  analysisData,
  onPreferences,
  onRecommendations,
  onBack,
}: {
  photo: string
  analysisData: AnalysisData | null
  onPreferences: () => void
  onRecommendations: () => void
  onBack: () => void
}) {
  if (!analysisData?.attributes) {
    return (
      <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
        <BackBtn onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center text-center pt-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" stroke="#c9a96e" strokeWidth="1.5" strokeDasharray="3 3"/><path d="M14 9v6M14 19v.5" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/></svg>
          </div>
          <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--foreground)' }}>No Analysis Available</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
            Photo analysis data is unavailable for this session. Please retake or upload a clear photo to continue.
          </p>
          <div className="w-24 h-24 rounded-xl overflow-hidden mb-6">
            <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className="space-y-3">
          <PrimaryBtn onClick={onBack}>Upload New Photo</PrimaryBtn>
        </div>
      </div>
    )
  }

  const displayObs = [
    {
      label: 'Face shape',
      value: formatAttrValue(extractValue(analysisData.attributes.faceShape)),
      source: extractSource(analysisData.attributes.faceShape),
    },
    {
      label: 'Hair pattern',
      value: formatAttrValue(extractValue(analysisData.attributes.hairType)),
      source: extractSource(analysisData.attributes.hairType),
    },
    {
      label: 'Current length',
      value: formatAttrValue(extractValue(analysisData.attributes.hairLength)),
      source: extractSource(analysisData.attributes.hairLength),
    },
    {
      label: 'Hairline',
      value: formatAttrValue(extractValue(analysisData.attributes.hairLine)),
      source: extractSource(analysisData.attributes.hairLine),
    },
    {
      label: 'Hair thickness',
      value: formatAttrValue(extractValue(analysisData.attributes.hairThickness)),
      source: extractSource(analysisData.attributes.hairThickness),
    },
    {
      label: 'Visual Suitability',
      value: analysisData.visualSuitability.isValid ? 'Verified' : 'Flagged',
      source: analysisData.visualSuitability.isValid ? 'Observed' : 'Unknown',
    },
  ]

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="relative flex-shrink-0" style={{ height: '44vh' }}>
        <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.45) 0%, transparent 35%, rgba(8,12,20,0.88) 80%, rgba(8,12,20,1) 100%)' }} />
        <div className="absolute top-12 left-5 right-5 flex items-center justify-between">
          <BackBtn onBack={onBack} />
          <SimBadge label="AI Analysis" />
        </div>
        <div className="absolute bottom-4 left-5">
          <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>What we can see</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(240,235,224,0.55)' }}>Observed from your photo</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {displayObs.map((obs, i) => (
            <div key={i} className="rounded-xl p-3.5" style={{ background: obs.source === 'Unknown' ? 'rgba(138,130,120,0.08)' : 'var(--secondary)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between items-start mb-1">
                <p className="uppercase" style={{ color: obs.source === 'Unknown' ? 'var(--muted-foreground)' : '#c9a96e', fontSize: 9, letterSpacing: '0.1em' }}>
                  {obs.label}
                </p>
                {obs.source !== 'Unknown' && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold" style={{ background: 'rgba(201,169,110,0.15)', color: '#c9a96e' }}>
                    {obs.source}
                  </span>
                )}
              </div>
              <p className="text-sm font-medium" style={{ color: obs.source === 'Unknown' ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                {obs.value}
              </p>
              {obs.source === 'Unknown' && (
                <p style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Not observed</p>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)' }}>
          Unknown attributes are reported as unknown — nothing is fabricated. You can refine direction in preferences.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onPreferences}
            className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-all active:scale-95"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 48 }}
          >
            Set Preferences
          </button>
          <button
            onClick={onRecommendations}
            className="flex-[1.4] py-3.5 rounded-xl font-medium text-sm transition-all active:scale-95"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 48 }}
          >
            See Recommendations
          </button>
        </div>
      </div>
    </div>
  )
}

// ── CustomizeYourLookScreen ────────────────────────────────────────────────

function CustomizeYourLookScreen({
  initialPrefs,
  onApply,
  onBack,
  showSkip = false,
  onSkip,
}: {
  initialPrefs: Prefs
  onApply: (newPrefs: Prefs) => void
  onBack: () => void
  showSkip?: boolean
  onSkip?: () => void
}) {
  const [draft, setDraft] = useState<Prefs>({ ...initialPrefs })

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-5 flex-shrink-0">
        <BackBtn onBack={onBack} />
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>Customize Your Look</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Make your recommendations more personal.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6">
        {/* Style / Vibe */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>What style do you like?</p>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, vibe: prev.vibe === v ? '' : v }))}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  background: draft.vibe === v ? '#c9a96e' : 'var(--secondary)',
                  color: draft.vibe === v ? '#080c14' : 'var(--foreground)',
                  border: draft.vibe === v ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 44,
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>How long do you want your hair?</p>
          <div className="flex gap-2">
            {LENGTHS.map(l => (
              <button
                key={l}
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, length: prev.length === l ? '' : l }))}
                className="flex-1 py-3 rounded-lg text-xs font-medium text-center transition-all active:scale-95"
                style={{
                  background: draft.length === l ? '#c9a96e' : 'var(--secondary)',
                  color: draft.length === l ? '#080c14' : 'var(--foreground)',
                  border: draft.length === l ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 44,
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Styling Effort */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>How much time do you spend styling?</p>
          <div className="flex gap-2">
            {EFFORTS.map(e => (
              <button
                key={e.id}
                type="button"
                onClick={() => setDraft(prev => ({ ...prev, effort: prev.effort === e.id ? '' : e.id }))}
                className="flex-1 py-3 rounded-lg text-center transition-all active:scale-95"
                style={{
                  background: draft.effort === e.id ? '#c9a96e' : 'var(--secondary)',
                  color: draft.effort === e.id ? '#080c14' : 'var(--foreground)',
                  border: draft.effort === e.id ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 52,
                }}
              >
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>{e.detail}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Anything else? */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Anything else?</p>
          <textarea
            value={draft.notes}
            onChange={e => { if (e.target.value.length <= 500) setDraft(prev => ({ ...prev, notes: e.target.value })) }}
            placeholder="E.g. 'Keep the sides professional-looking' or 'Prefer low maintenance'"
            rows={3}
            maxLength={500}
            className="w-full rounded-xl p-4 text-sm resize-none"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', minHeight: 88 }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted-foreground)' }}>{draft.notes.length}/500</p>
        </div>

        <div className="flex gap-3 pt-2">
          {showSkip && onSkip ? (
            <button
              type="button"
              onClick={onSkip}
              className="flex-1 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 52 }}
            >Skip</button>
          ) : (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 52 }}
            >Back</button>
          )}
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-[2] py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 52 }}
          >Apply & See Recommendations</button>
        </div>
      </div>
    </div>
  )
}

// ── RecommendationsScreen ──────────────────────────────────────────────────

function RecommendationsScreen({
  photo,
  prefs,
  recommendations,
  analysisData,
  loading,
  errorMessage,
  onRetry,
  activeRec,
  setActiveRec,
  chosenRec,
  setChosenRec,
  onSeePreview,
  onCustomize,
  onBack,
}: {
  photo: string
  prefs: Prefs
  recommendations: HairstyleItem[]
  analysisData?: AnalysisData | null
  loading: boolean
  errorMessage: string | null
  onRetry: () => void
  activeRec: number
  setActiveRec: (i: number) => void
  chosenRec: number | null
  setChosenRec: (i: number | null) => void
  onSeePreview: () => void
  onCustomize: () => void
  onBack: () => void
}) {
  const displayObs = analysisData?.attributes ? [
    {
      label: 'Face shape',
      value: formatAttrValue(extractValue(analysisData.attributes.faceShape)),
      source: extractSource(analysisData.attributes.faceShape),
    },
    {
      label: 'Hair pattern',
      value: formatAttrValue(extractValue(analysisData.attributes.hairType)),
      source: extractSource(analysisData.attributes.hairType),
    },
    {
      label: 'Current length',
      value: formatAttrValue(extractValue(analysisData.attributes.hairLength)),
      source: extractSource(analysisData.attributes.hairLength),
    },
    {
      label: 'Hairline',
      value: formatAttrValue(extractValue(analysisData.attributes.hairLine)),
      source: extractSource(analysisData.attributes.hairLine),
    },
    {
      label: 'Hair thickness',
      value: formatAttrValue(extractValue(analysisData.attributes.hairThickness)),
      source: extractSource(analysisData.attributes.hairThickness),
    },
    {
      label: 'Visual Suitability',
      value: analysisData.visualSuitability?.isValid ? 'Verified' : 'Flagged',
      source: analysisData.visualSuitability?.isValid ? 'Observed' : 'Unknown',
    },
  ] : []

  const hasAppliedPrefs = Boolean(
    (prefs.vibe && prefs.vibe.trim()) ||
    (prefs.length && prefs.length.trim()) ||
    (prefs.effort && prefs.effort.trim()) ||
    (prefs.notes && prefs.notes.trim())
  )

  const effortLabel = prefs.effort
    ? (EFFORTS.find(e => e.id === prefs.effort)?.label || prefs.effort)
    : ''

  if (loading) {
    return (
      <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
        <div className="relative flex-shrink-0" style={{ height: '48vh' }}>
          <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" style={{ opacity: 0.65, filter: 'blur(1px)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.5) 0%, transparent 35%, rgba(8,12,20,0.85) 75%, rgba(8,12,20,1) 100%)' }} />
          <div className="absolute top-12 left-5">
            <BackBtn onBack={onBack} />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-2 spinner" style={{ borderColor: 'rgba(201,169,110,0.3)', borderTopColor: '#c9a96e' }} />
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>Crafting your cuts…</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(240,235,224,0.6)' }}>Generating recommendations grounded in your features</p>
          </div>
        </div>
        <div className="flex-1 px-5 pt-8 flex flex-col items-center justify-center gap-3">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => <div key={i} className="loading-dot w-2 h-2 rounded-full" style={{ background: '#c9a96e' }} />)}
          </div>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Matching face shape and hair characteristics</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
        <BackBtn onBack={onBack} />
        <div className="flex-1 flex flex-col items-center text-center pt-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(229,115,115,0.12)', border: '2px solid rgba(229,115,115,0.35)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 9v7M14 19.5v.5" stroke="#e57373" strokeWidth="2" strokeLinecap="round" /><circle cx="14" cy="14" r="11" stroke="#e57373" strokeWidth="1.5" /></svg>
          </div>
          <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--foreground)' }}>Recommendation failed</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
            {errorMessage}
          </p>
          <div className="w-24 h-24 rounded-xl overflow-hidden mb-5">
            <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className="space-y-3">
          <PrimaryBtn onClick={onRetry}>Retry Recommendations</PrimaryBtn>
          <GhostBtn onClick={onBack}>Back to Direction</GhostBtn>
        </div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
        <BackBtn onBack={onBack} />
        <div className="flex-1 flex flex-col items-center text-center pt-10">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 6v8m0 4v.5" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" /><circle cx="14" cy="14" r="11" stroke="#c9a96e" strokeWidth="1.5" /></svg>
          </div>
          <h2 className="font-display text-2xl mb-3" style={{ color: 'var(--foreground)' }}>No recommendations found</h2>
          <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
            We could not find matching recommendations for your photo. Try generating again or adjust your preferences.
          </p>
          <div className="w-24 h-24 rounded-xl overflow-hidden mb-5">
            <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
          </div>
        </div>
        <div className="space-y-3">
          <PrimaryBtn onClick={onRetry}>Get Recommendations</PrimaryBtn>
          <GhostBtn onClick={onBack}>Back to Direction</GhostBtn>
        </div>
      </div>
    )
  }

  const safeActiveRec = Math.min(Math.max(0, activeRec), recommendations.length - 1)
  const rec = recommendations[safeActiveRec]

  // Ensure chosenRec is selected by default so the active cut is chosen
  useEffect(() => {
    if (recommendations.length > 0 && (chosenRec === null || chosenRec !== safeActiveRec)) {
      setChosenRec(safeActiveRec)
    }
  }, [chosenRec, safeActiveRec, setChosenRec, recommendations.length])

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Portrait anchor — clean & unobstructed (no text/cards/controls over the photo) */}
      <div className="relative flex-shrink-0" style={{ height: '48vh' }}>
        <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.4) 0%, transparent 20%, transparent 80%, rgba(8,12,20,0.85) 100%)' }} />

        {/* Top navigation row with Back button only */}
        <div className="absolute top-12 left-5">
          <BackBtn onBack={onBack} />
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
        {/* Photo Analysis Observations */}
        {analysisData?.attributes && (
          <div
            className="rounded-xl p-4 mb-4"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--foreground)' }}>
                  What we can see
                </h2>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(240,235,224,0.55)' }}>
                  Observed from your photo
                </p>
              </div>
              <span
                className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold"
                style={{
                  background: 'rgba(201,169,110,0.15)',
                  color: '#c9a96e',
                  border: '1px solid rgba(201,169,110,0.25)',
                }}
              >
                Analysis
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {displayObs.map((obs, i) => (
                <div
                  key={i}
                  className="rounded-xl p-3"
                  style={{
                    background:
                      obs.source === 'Unknown' ? 'rgba(138,130,120,0.08)' : 'var(--secondary)',
                    border: '1px solid var(--border)',
                    minWidth: 0,
                  }}
                >
                  <div className="flex justify-between items-start mb-1 gap-1">
                    <p
                      className="uppercase truncate"
                      style={{
                        color: obs.source === 'Unknown' ? 'var(--muted-foreground)' : '#c9a96e',
                        fontSize: 9,
                        letterSpacing: '0.1em',
                      }}
                    >
                      {obs.label}
                    </p>
                    {obs.source && obs.source !== 'Unknown' && (
                      <span
                        className="px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-semibold flex-shrink-0"
                        style={{
                          background:
                            obs.source === 'Inferred'
                              ? 'rgba(201,169,110,0.2)'
                              : obs.source === 'User-provided'
                                ? 'rgba(255,255,255,0.08)'
                                : 'rgba(201,169,110,0.15)',
                          color:
                            obs.source === 'User-provided'
                              ? 'var(--muted-foreground)'
                              : '#c9a96e',
                          border: '1px solid rgba(201,169,110,0.25)',
                        }}
                      >
                        {obs.source}
                      </span>
                    )}
                  </div>
                  <p
                    className="text-sm font-medium truncate"
                    style={{
                      color: obs.source === 'Unknown' ? 'var(--muted-foreground)' : 'var(--foreground)',
                    }}
                  >
                    {obs.value}
                  </p>
                  {obs.source === 'Unknown' && (
                    <p style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Not observed</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unified Outer Container: Best Match badge + Haircut Name + Description + Divider + Why This Works For You */}
        <div
          key={safeActiveRec}
          className="rounded-xl p-4 mb-4"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {rec.bestMatch && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span
                className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                style={{ background: 'rgba(201,169,110,0.18)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.3)' }}
              >
                Best Match
              </span>
              {rec.bestMatchReason && (
                <span className="text-xs" style={{ color: 'rgba(201,169,110,0.9)' }}>
                  • {rec.bestMatchReason}
                </span>
              )}
            </div>
          )}

          <h2 className="font-display text-2xl font-bold leading-tight" style={{ color: 'var(--foreground)' }}>
            {rec.name}
          </h2>
          <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            {rec.description}
          </p>

          {/* Subtle internal divider */}
          <div className="my-3.5" style={{ borderTop: '1px solid var(--border)', opacity: 0.6 }} />

          {/* Existing Rationale: Why This Works For You */}
          <div>
            <p className="uppercase mb-2.5 font-semibold" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.12em' }}>
              Why this works for you
            </p>

            <div className="space-y-1.5 mb-3">
              {rec.reasonEvidence.map((e, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(201,169,110,0.6)' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium" style={{ color: '#c9a96e' }}>{e.obs}</span>
                    {e.source && e.source !== 'Observed' && (
                      <span
                        className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-normal tracking-wide uppercase inline-block align-middle"
                        style={{
                          background: e.source === 'Inferred' ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.08)',
                          color: e.source === 'Inferred' ? '#c9a96e' : 'var(--muted-foreground)',
                          border: '1px solid rgba(201,169,110,0.25)',
                        }}
                      >
                        {e.source}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> — {e.contribution}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <path d="M2 7h10M8 3l4 4-4 4" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs font-medium leading-snug" style={{ color: 'var(--foreground)' }}>{rec.reason}</p>
            </div>
          </div>
        </div>

        {/* Practical Cards: Feasibility */}
        {rec.feasibility && (
          <div className="rounded-xl p-4 mb-4" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <p className="uppercase mb-1" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>Feasibility</p>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{rec.feasibility}</p>
            {rec.transitionGuidance && (
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--secondary-foreground)' }}>{rec.transitionGuidance}</p>
            )}
          </div>
        )}

        {/* Practical Cards: Effort + Consider row */}
        <div className="flex gap-2.5 mb-4">
          <div className="flex-1 rounded-xl p-3" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <p className="uppercase mb-1" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>Effort</p>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{rec.effort}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{rec.effortDetail}</p>
          </div>
          <div className="flex-1 rounded-xl p-3" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
            <p className="uppercase mb-1" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>Consider</p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--secondary-foreground)' }}>{rec.limitation}</p>
          </div>
        </div>

        {/* Your Preferences Section — Directly Below Feasibility, Effort, and Consider */}
        <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold" style={{ color: 'var(--foreground)' }}>Your Preferences</h3>
            <button
              type="button"
              onClick={onCustomize}
              className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all active:scale-95"
              style={{ color: '#c9a96e', background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}
            >
              {hasAppliedPrefs ? 'Edit' : 'Customize'}
            </button>
          </div>

          {hasAppliedPrefs ? (
            <div className="mt-3 space-y-2.5">
              <div className="flex flex-wrap gap-2">
                {prefs.vibe && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Style:</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{prefs.vibe}</span>
                  </div>
                )}
                {prefs.length && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Hair length:</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{prefs.length}</span>
                  </div>
                )}
                {effortLabel && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--muted-foreground)' }}>Styling effort:</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{effortLabel}</span>
                  </div>
                )}
              </div>
              {prefs.notes && prefs.notes.trim() && (
                <div className="pt-2 text-xs leading-relaxed" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted-foreground)' }}>
                  <span className="font-medium" style={{ color: 'var(--foreground)' }}>Additional notes: </span>
                  <span style={{ color: 'var(--secondary-foreground)' }}>{prefs.notes}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-2.5 flex items-center justify-between">
              <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>No additional preferences applied yet.</p>
              <button
                type="button"
                onClick={onCustomize}
                className="text-xs font-medium"
                style={{ color: '#c9a96e', textDecoration: 'underline' }}
              >
                Customize
              </button>
            </div>
          )}
        </div>

        {/* Standalone Primary CTA: Try This Look — Preview on Me */}
        <div className="mb-2">
          <button
            type="button"
            onClick={() => {
              setChosenRec(safeActiveRec)
              onSeePreview()
            }}
            className="w-full py-4 rounded-xl font-medium text-base transition-all active:scale-[0.98]"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 56 }}
          >
            Try This Look — Preview on Me
          </button>
        </div>
      </div>
    </div>
  )
}

// ── PreviewLoadingScreen ────────────────────────────────────────────────────

function PreviewLoadingScreen({
  photo,
  revisionId,
  selectedHairstyle,
  onComplete,
  onFail,
}: {
  photo: string
  revisionId: string | null
  selectedHairstyle: HairstyleItem
  onComplete: (url: string) => void
  onFail: (errorMsg?: string) => void
}) {
  const [step, setStep] = useState(0)
  const steps = [
    'Preparing your photo…',
    'Selecting hairstyle with AI…',
    'Simulating selected hairstyle…',
    'Finalising your preview…',
  ]

  const isMountedRef = useRef(true)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const onFailRef = useRef(onFail)
  onFailRef.current = onFail
  const executedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep(prev => (prev < steps.length - 1 ? prev + 1 : prev))
    }, 1400)

    async function runGeneration() {
      try {
        if (!revisionId) {
          onFailRef.current('No revision ID found. Please upload a photo first.')
          return
        }

        const hairstyleId = selectedHairstyle.backendId || String(selectedHairstyle.id)
        const execKey = `${revisionId}:${hairstyleId}`

        // StrictMode remount deduplication (DEF-001)
        if (executedKeyRef.current === execKey) {
          return
        }
        executedKeyRef.current = execKey

        // 1. Select hairstyle on backend to set state to READY_FOR_PREVIEW
        await selectHairstyle(revisionId, hairstyleId)
        if (!isMountedRef.current) return

        // 2. Generate preview via AI backend
        const res = await generatePreview(revisionId, hairstyleId)
        if (!isMountedRef.current) return

        if (res.route === 'SUCCESS' && res.previewImageUrl) {
          onCompleteRef.current(res.previewImageUrl)
        } else {
          onFailRef.current(res.message || 'AI preview generation failed.')
        }
      } catch (err: any) {
        if (!isMountedRef.current) return
        onFailRef.current(err.message || 'Failed to connect to preview service.')
      }
    }

    runGeneration()

    return () => {
      clearInterval(stepInterval)
    }
  }, [revisionId, selectedHairstyle.backendId, selectedHairstyle.id])

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="relative flex-shrink-0" style={{ height: '54vh' }}>
        <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" style={{ opacity: 0.55, filter: 'blur(1.5px)' }} />
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(8,12,20,0.35)' }}>
          <div className="w-14 h-14 rounded-full border-2 spinner" style={{ borderColor: 'rgba(201,169,110,0.3)', borderTopColor: '#c9a96e' }} />
        </div>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 45%, rgba(8,12,20,1) 100%)' }} />
        <div className="absolute top-12 left-5">
          <SimBadge label="Generating AI Preview" />
        </div>
        <div className="absolute bottom-4 left-5">
          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: 'var(--muted-foreground)', fontSize: 9 }}>Generating</p>
          <h3 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>{selectedHairstyle.name}</h3>
        </div>
      </div>

      <div className="px-5 pt-6 pb-8 space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 transition-all duration-300" style={{ opacity: i <= step ? 1 : 0.22 }}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: i < step ? '#c9a96e' : 'var(--secondary)',
                border: i === step ? '2px solid rgba(201,169,110,0.7)' : 'none',
                transition: 'all 300ms',
              }}
            >
              {i < step ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5L4.5 7.5L8 3" stroke="#080c14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : i === step ? (
                <div className="w-2 h-2 rounded-full" style={{ background: '#c9a96e', animation: 'dotPulse 1s ease-in-out infinite' }} />
              ) : null}
            </div>
            <span className="text-sm" style={{ color: i <= step ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{s}</span>
          </div>
        ))}
        <button onClick={() => onFail('Simulated failure triggered by user')} className="text-xs mt-6 text-left" style={{ color: 'var(--muted-foreground)', textDecoration: 'underline' }}>
          Demo: simulate preview failure
        </button>
      </div>
    </div>
  )
}

// ── PreviewFailureScreen ───────────────────────────────────────────────────

function PreviewFailureScreen({
  selectedHairstyle,
  errorMessage,
  onRetry,
  onContinueWithout,
  onBack,
}: {
  selectedHairstyle: HairstyleItem
  errorMessage?: string | null
  onRetry: () => void
  onContinueWithout: () => void
  onBack?: () => void
}) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
      {onBack && (
        <div className="mb-4">
          <BackBtn onBack={onBack} />
        </div>
      )}
      <div className="flex-1 flex flex-col items-center text-center pt-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(229,115,115,0.1)', border: '2px solid rgba(229,115,115,0.32)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 9v7M14 19.5v.5" stroke="#e57373" strokeWidth="2" strokeLinecap="round" /><circle cx="14" cy="14" r="11" stroke="#e57373" strokeWidth="1.5" /></svg>
        </div>
        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--foreground)' }}>Preview failed</h2>
        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--muted-foreground)', maxWidth: 290 }}>
          Your selected haircut, <strong style={{ color: 'var(--secondary-foreground)' }}>{selectedHairstyle.name}</strong>, is still chosen.
        </p>
        {errorMessage && (
          <div className="rounded-lg p-3 mb-4 w-full" style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.2)' }}>
            <p className="text-xs text-center" style={{ color: '#e57373' }}>{errorMessage}</p>
          </div>
        )}
        <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
          Retry the preview or continue to your Barber Brief without it.
        </p>
      </div>
      <div className="space-y-3">
        <PrimaryBtn onClick={onRetry}>Retry Preview</PrimaryBtn>
        <GhostBtn onClick={onContinueWithout}>Continue Without Preview</GhostBtn>
      </div>
    </div>
  )
}

// ── PreviewScreen ─────────────────────────────────────────────────────────

function PreviewScreen({
  photo,
  previewImageUrl,
  selectedHairstyle,
  previewMode,
  setPreviewMode,
  onContinue,
  onRetry,
  onBack,
}: {
  photo: string
  previewImageUrl: string | null
  selectedHairstyle: HairstyleItem
  previewMode: 'original' | 'possible'
  setPreviewMode: (m: 'original' | 'possible') => void
  onContinue: () => void
  onRetry: () => void
  onBack: () => void
}) {
  const rec = selectedHairstyle
  const isPossible = previewMode === 'possible'
  const [holdActive, setHoldActive] = useState(false)

  // Hold-to-compare: hold shows original, release shows possible
  const shownAsPossible = isPossible && !holdActive
  const aiImageSrc = previewImageUrl || photo

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Portrait with crossfade — face/scale/framing locked */}
      <div className="relative flex-shrink-0" style={{ height: '62vh' }}>
        {/* Me Now — original */}
        <img
          src={photo}
          alt="Me Now — original photo"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: shownAsPossible ? 0 : 1, transition: 'opacity 620ms ease' }}
        />
        {/* Possible You — AI simulation */}
        <img
          src={aiImageSrc}
          alt="Possible You — AI simulation"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: shownAsPossible ? 1 : 0, transition: 'opacity 620ms ease' }}
        />

        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.52) 0%, transparent 22%, rgba(8,12,20,0.7) 68%, rgba(8,12,20,1) 100%)' }} />

        <div className="absolute top-12 left-5 right-5 flex items-center justify-between">
          <BackBtn onBack={onBack} />
          <SimBadge label="AI Simulation" />
        </div>

        {/* State label — bottom of portrait */}
        <div className="absolute bottom-4 left-5 right-5">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg mb-2"
            style={{
              background: shownAsPossible ? 'rgba(201,169,110,0.14)' : 'rgba(240,235,224,0.08)',
              border: shownAsPossible ? '1px solid rgba(201,169,110,0.3)' : '1px solid rgba(240,235,224,0.12)',
              transition: 'all 400ms ease',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: shownAsPossible ? '#c9a96e' : 'rgba(240,235,224,0.6)', transition: 'background 400ms ease' }}
            />
            <span
              className="text-xs font-medium"
              style={{
                color: shownAsPossible ? '#c9a96e' : 'rgba(240,235,224,0.75)',
                letterSpacing: '0.06em',
                transition: 'color 400ms ease',
              }}
            >
              {shownAsPossible ? 'Possible You — AI Simulation' : 'Me Now — Original Photo'}
            </span>
          </div>
          <h2 className="font-display text-[28px] leading-tight transition-all duration-400" style={{ color: 'var(--foreground)' }}>
            {shownAsPossible ? rec.name : 'Your current look'}
          </h2>
        </div>
      </div>

      {/* Controls */}
      <div className="px-5 pt-4 pb-6">
        {/* Me Now / Possible Me toggle */}
        <div className="flex gap-1.5 mb-4 p-1 rounded-xl" style={{ background: 'var(--secondary)' }}>
          <button
            onClick={() => setPreviewMode('original')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ background: !isPossible ? 'var(--card)' : 'transparent', color: !isPossible ? 'var(--foreground)' : 'var(--muted-foreground)', minHeight: 44 }}
          >
            Me Now
          </button>
          <button
            onClick={() => setPreviewMode('possible')}
            className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
            style={{ background: isPossible ? '#c9a96e' : 'transparent', color: isPossible ? '#080c14' : 'var(--muted-foreground)', minHeight: 44 }}
          >
            Possible You
          </button>
        </div>

        {/* Hold-to-compare affordance */}
        {isPossible && (
          <button
            onPointerDown={() => setHoldActive(true)}
            onPointerUp={() => setHoldActive(false)}
            onPointerLeave={() => setHoldActive(false)}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all mb-3 active:scale-[0.98]"
            style={{
              background: holdActive ? 'rgba(240,235,224,0.12)' : 'var(--secondary)',
              color: holdActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              border: '1px solid var(--border)',
              minHeight: 44,
            }}
          >
            {holdActive ? 'Me Now (original)' : 'Hold to Compare'}
          </button>
        )}

        {/* Simulation disclaimer — always visible in possible mode */}
        {isPossible && (
          <div className="rounded-lg px-3 py-2.5 mb-4" style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.16)' }}>
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(240,235,224,0.55)' }}>
              This is a <strong style={{ color: 'rgba(240,235,224,0.75)' }}>possibility</strong>, not a guarantee. Your actual barber result will depend on their technique and your hair's natural behaviour.
            </p>
          </div>
        )}

        <div className="flex gap-2.5">
          <button
            onClick={onRetry}
            className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-all active:scale-95"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 48 }}
          >
            Retry
          </button>
          <button
            onClick={onContinue}
            className="flex-[2] py-3.5 rounded-xl font-medium text-sm transition-all active:scale-95"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 48 }}
          >
            Continue to Brief →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── BarberBriefScreen ─────────────────────────────────────────────────────

function BarberBriefScreen({
  photo,
  previewImageUrl,
  selectedHairstyle,
  previewAvail,
  notes,
  setNotes,
  onSave,
  onBack,
}: {
  photo: string
  previewImageUrl: string | null
  selectedHairstyle: HairstyleItem
  previewAvail: boolean
  notes: string
  setNotes: (s: string) => void
  onSave: () => void
  onBack: () => void
}) {
  const rec = selectedHairstyle
  const [briefExpanded, setBriefExpanded] = useState(false)
  const [showPresentationModal, setShowPresentationModal] = useState(false)
  const UNKNOWNS = ['Exact fade height (confirm with barber)', 'Parting preference if applicable']

  let rows: { label: string; value: string }[] = []

  if (rec.barberBrief) {
    const brief = rec.barberBrief
    if (brief.top) rows.push({ label: 'Top', value: brief.top })
    if (brief.sides) rows.push({ label: 'Sides', value: brief.sides })
    if (brief.back) rows.push({ label: 'Back', value: brief.back })
    if (brief.fringe) rows.push({ label: 'Fringe', value: brief.fringe })
    if (brief.styling) rows.push({ label: 'Styling', value: brief.styling })
    if (brief.maintenance) rows.push({ label: 'Maintenance', value: brief.maintenance })
    if (brief.preserve) rows.push({ label: 'Preserve', value: brief.preserve })
    if (brief.avoid) rows.push({ label: 'Avoid', value: brief.avoid })
  } else {
    if (rec.top) rows.push({ label: 'Top', value: rec.top })
    if (rec.sides) rows.push({ label: 'Sides', value: rec.sides })
    if (rec.back) rows.push({ label: 'Back', value: rec.back })
    if (rec.fade) rows.push({ label: 'Fade / Taper', value: rec.fade })
    if (rec.styling) rows.push({ label: 'Styling', value: rec.styling })
    if (rec.description) rows.push({ label: 'Description', value: rec.description })
    if (rec.constraints && rec.constraints.length > 0) rows.push({ label: 'Constraints', value: rec.constraints.join('. ') })
  }

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-5 pt-12 pb-4 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <BackBtn onBack={onBack} />
        <div className="flex-1">
          <p className="uppercase" style={{ color: '#c9a96e', fontSize: 9, letterSpacing: '0.14em' }}>Barber Brief</p>
          <h2 className="font-display text-2xl leading-tight" style={{ color: 'var(--foreground)' }}>{rec.name}</h2>
        </div>
        <button
          onClick={onSave}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all active:scale-95"
          style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', minHeight: 44 }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M11 12.5H3a1 1 0 01-1-1V2.5a1 1 0 011-1h6.5L12 4v7.5a1 1 0 01-1 1z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M9.5 1.5v3H4v-3M4.5 8h5M4.5 10h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
          </svg>
          Save
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        {/* Photo pair — big and clear */}
        <div className="px-5 pt-4 mb-5">
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl overflow-hidden relative" style={{ aspectRatio: '3/4' }}>
              <img src={photo} alt="Original photo" className="w-full h-full object-cover object-top" />
              <div
                className="absolute bottom-0 left-0 right-0 py-2 px-3"
                style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.92) 0%, transparent 100%)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'rgba(240,235,224,0.7)' }}>Original</p>
              </div>
            </div>
            {previewAvail && previewImageUrl ? (
              <div className="flex-1 rounded-xl overflow-hidden relative" style={{ aspectRatio: '3/4' }}>
                <img src={previewImageUrl} alt="AI Simulation" className="w-full h-full object-cover object-top" />
                <div
                  className="absolute bottom-0 left-0 right-0 py-2 px-3"
                  style={{ background: 'linear-gradient(to top, rgba(8,12,20,0.92) 0%, transparent 100%)' }}
                >
                  <p className="text-xs font-medium" style={{ color: '#c9a96e' }}>AI Simulation</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 rounded-xl flex flex-col items-center justify-center" style={{ aspectRatio: '3/4', background: 'var(--secondary)', border: '1px dashed var(--border)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" className="mb-2">
                  <circle cx="11" cy="11" r="9" stroke="var(--muted-foreground)" strokeWidth="1.2" strokeDasharray="3 2" />
                  <path d="M11 7v4l3 3" stroke="var(--muted-foreground)" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <p className="text-xs text-center px-3 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>No preview generated</p>
              </div>
            )}
          </div>
        </div>

        {/* Brief rows */}
        <div className="px-5">
          {rows.map((row, i) => (
            <div
              key={row.label}
              className="flex gap-4 py-3.5"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <p className="uppercase flex-shrink-0 w-24 pt-0.5" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>{row.label}</p>
              <p className="text-sm flex-1" style={{ color: 'var(--foreground)' }}>{row.value}</p>
            </div>
          ))}
        </div>

        {/* Notes */}
        <div className="px-5 pt-3 pb-2" style={{ borderTop: '1px solid var(--border)', marginTop: 4 }}>
          <p className="uppercase mb-2 pt-3" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>Notes</p>
          <textarea
            value={notes}
            onChange={e => { if (e.target.value.length <= 500) setNotes(e.target.value) }}
            placeholder="Add anything for your barber…"
            rows={2}
            className="w-full rounded-lg p-3 text-sm resize-none"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)' }}
          />
        </div>

        {/* Confirm with barber */}
        <div className="mx-5 rounded-xl p-4 mt-2 mb-5" style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.2)' }}>
          <p className="uppercase mb-2" style={{ color: '#c9a96e', fontSize: 9, letterSpacing: '0.12em' }}>Confirm with your barber</p>
          {UNKNOWNS.map(u => (
            <p key={u} className="text-sm mb-1" style={{ color: 'var(--secondary-foreground)' }}>· {u}</p>
          ))}
        </div>

        {/* Brief expand toggle — anatomy */}
        <div className="mx-5 mb-5">
          <button
            onClick={() => setBriefExpanded(!briefExpanded)}
            className="w-full flex items-center justify-between py-3 px-4 rounded-xl text-sm font-medium transition-all active:scale-[0.99]"
            style={{ background: 'var(--secondary)', color: 'var(--secondary-foreground)', border: '1px solid var(--border)', minHeight: 48 }}
          >
            <span>Haircut anatomy</span>
            <svg
              width="16" height="16" viewBox="0 0 16 16" fill="none"
              style={{ transform: briefExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
            >
              <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          {briefExpanded && (
            <div className="mt-2 rounded-xl p-4 space-y-2" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              {[
                { label: 'Style family', value: rec.name },
                ...rows,
              ].map(r => (
                <div key={r.label} className="flex gap-3">
                  <span className="uppercase flex-shrink-0 w-24" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em', paddingTop: 2 }}>{r.label}</span>
                  <span className="text-xs" style={{ color: 'var(--secondary-foreground)' }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Primary CTA — Show My Barber */}
        <div className="px-5">
          <button
            className="w-full py-4 rounded-xl font-medium text-base transition-all active:scale-[0.98] mb-3"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 56, fontFamily: 'var(--font-sans)' }}
            onClick={() => setShowPresentationModal(true)}
          >
            Show My Barber
          </button>
          <GhostBtn onClick={onSave}>Save This Haircut</GhostBtn>
        </div>

        {/* Barber Presentation Mode Modal (DEF-003 Option A) */}
        {showPresentationModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            style={{ background: 'rgba(4, 6, 10, 0.88)', backdropFilter: 'blur(8px)' }}
            onClick={() => setShowPresentationModal(false)}
          >
            <div
              className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border"
              style={{ background: '#0a0f18', borderColor: 'rgba(201,169,110,0.3)', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'rgba(240,235,224,0.08)', background: '#0f1622' }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#c9a96e] animate-pulse" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#c9a96e] font-semibold">Barber Presentation Mode</span>
                    <h3 className="font-display text-xl text-[#f0ebe0] leading-none mt-0.5">{rec.name}</h3>
                  </div>
                </div>
                <button
                  onClick={() => setShowPresentationModal(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#8e98a8] hover:text-[#f0ebe0] bg-[#141d2b] transition-colors"
                  aria-label="Close Barber Mode"
                >
                  &times;
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Visual reference side-by-side */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl overflow-hidden border border-[rgba(240,235,224,0.08)] bg-[#04060a]">
                    <div className="aspect-[3/4] relative">
                      <img src={photo} alt="Original reference" className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="py-1 px-2.5 text-center bg-[#0d1420]">
                      <span className="text-[11px] font-medium text-[#8e98a8]">Current (Before)</span>
                    </div>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-[rgba(201,169,110,0.25)] bg-[#04060a]">
                    <div className="aspect-[3/4] relative">
                      {previewAvail && previewImageUrl ? (
                        <img src={previewImageUrl} alt="Target simulation" className="w-full h-full object-cover object-top" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#8e98a8] p-2 text-center">Reference look</div>
                      )}
                    </div>
                    <div className="py-1 px-2.5 text-center bg-[#151c28]">
                      <span className="text-[11px] font-medium text-[#c9a96e]">Target (After)</span>
                    </div>
                  </div>
                </div>

                {/* Structured Cutting Specifications */}
                <div className="rounded-xl p-3.5 border border-[rgba(240,235,224,0.08)] bg-[#0f1622]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#c9a96e] mb-2 font-semibold">Technical Cutting Specs</p>
                  <div className="space-y-2">
                    {rows.map(row => (
                      <div key={row.label} className="flex gap-2 text-xs">
                        <span className="w-24 flex-shrink-0 text-[#8e98a8] uppercase font-mono text-[10px] pt-0.5">{row.label}</span>
                        <span className="text-[#f0ebe0] font-medium leading-relaxed">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client Notes if any */}
                {notes && notes.trim().length > 0 && (
                  <div className="rounded-xl p-3.5 border border-[rgba(240,235,224,0.08)] bg-[#0f1622]">
                    <p className="text-[10px] font-mono uppercase tracking-widest text-[#8e98a8] mb-1 font-semibold">Client Preference Notes</p>
                    <p className="text-xs text-[#f0ebe0] leading-relaxed italic">"{notes}"</p>
                  </div>
                )}

                {/* Points to confirm */}
                <div className="rounded-xl p-3.5 border border-[rgba(201,169,110,0.2)] bg-[rgba(201,169,110,0.05)]">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-[#c9a96e] mb-1.5 font-semibold">Confirm with Barber</p>
                  <ul className="text-xs text-[#d1c8b8] space-y-1">
                    {UNKNOWNS.map(u => (
                      <li key={u} className="flex gap-1.5">
                        <span className="text-[#c9a96e]">•</span>
                        <span>{u}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[rgba(240,235,224,0.08)] bg-[#0f1622]">
                <button
                  onClick={() => setShowPresentationModal(false)}
                  className="w-full py-3 rounded-xl font-medium text-sm transition-all bg-[#c9a96e] text-[#080c14] active:scale-[0.98]"
                >
                  Done / Close Presentation Mode
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── SaveScreen ────────────────────────────────────────────────────────────

function SaveScreen({
  photo,
  previewImageUrl,
  selectedHairstyle,
  name,
  setName,
  onSave,
  onFail,
  onBack,
}: {
  photo: string
  previewImageUrl: string | null
  selectedHairstyle: HairstyleItem
  name: string
  setName: (s: string) => void
  onSave: () => void
  onFail: () => void
  onBack: () => void
}) {
  const rec = selectedHairstyle
  const [error, setError] = useState<string | null>(null)
  const thumbSrc = previewImageUrl || photo

  function handle() {
    const t = name.trim()
    if (!t) { setError('Please enter a name.'); return }
    if (t.length > 50) { setError('Name must be 50 characters or fewer.'); return }
    setError(null)
    onSave()
  }

  return (
    <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 mb-8">
        <BackBtn onBack={onBack} />
        <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>Save Haircut</h2>
      </div>

      <div className="flex-1 space-y-5">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
          Give this haircut a name. Your brief, selected style, and all details are saved.
        </p>

        <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
            <img src={thumbSrc} alt={rec.name} className="w-full h-full object-cover object-top" />
          </div>
          <div>
            <p className="uppercase mb-0.5" style={{ color: '#c9a96e', fontSize: 9, letterSpacing: '0.1em' }}>Selected Style</p>
            <p className="font-medium text-sm" style={{ color: 'var(--foreground)' }}>{rec.name}</p>
          </div>
        </div>

        <div>
          <label className="uppercase block mb-2" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.1em' }}>
            Name this haircut
          </label>
          <input
            type="text"
            value={name}
            onChange={e => { if (e.target.value.length <= 50) { setName(e.target.value); setError(null) } }}
            placeholder={rec.name}
            maxLength={50}
            className="w-full rounded-xl px-4 py-3.5 text-sm"
            style={{
              background: 'var(--secondary)',
              color: 'var(--foreground)',
              border: error ? '1px solid rgba(229,115,115,0.55)' : '1px solid var(--border)',
              fontFamily: 'var(--font-sans)',
              minHeight: 52,
            }}
          />
          <div className="flex justify-between mt-1">
            {error
              ? <p className="text-xs" style={{ color: '#e57373' }}>{error}</p>
              : <span />}
            <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{name.length}/50</p>
          </div>
        </div>

        <SimBadge label="Simulated Save" />

        <button
          onClick={onFail}
          className="text-xs text-left"
          style={{ color: 'var(--muted-foreground)', textDecoration: 'underline' }}
        >
          Demo: simulate save failure
        </button>
      </div>

      <PrimaryBtn onClick={handle} className="mt-6">Save</PrimaryBtn>
    </div>
  )
}

// ── SaveSuccessScreen ─────────────────────────────────────────────────────

function SaveSuccessScreen({
  photo,
  previewImageUrl,
  selectedHairstyle,
  name,
  onViewHaircuts,
  onHome,
}: {
  photo: string
  previewImageUrl: string | null
  selectedHairstyle: HairstyleItem
  name: string
  onViewHaircuts: () => void
  onHome: () => void
}) {
  const rec = selectedHairstyle
  const displayName = name.trim() || rec.name
  const heroSrc = previewImageUrl || photo

  return (
    <div className="screen-enter min-h-dvh flex flex-col items-center px-5 pt-14 pb-8" style={{ background: 'var(--background)' }}>
      <div className="w-full rounded-2xl overflow-hidden mb-8" style={{ border: '1px solid rgba(201,169,110,0.28)' }}>
        <div className="relative" style={{ height: 200 }}>
          <img src={heroSrc} alt={displayName} className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 35%, rgba(8,12,20,0.92) 100%)' }} />
          <div className="absolute bottom-4 left-4">
            <p className="uppercase mb-0.5" style={{ color: '#c9a96e', fontSize: 9, letterSpacing: '0.12em' }}>Saved</p>
            <p className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>{displayName}</p>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(201,169,110,0.12)', border: '2px solid rgba(201,169,110,0.35)' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11L9 16L18 6" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--foreground)' }}>Haircut saved</h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)', maxWidth: 280, margin: '0 auto' }}>
          Reopen this brief any time from My Haircuts and show it directly to your barber.
        </p>
      </div>

      <div className="w-full space-y-3">
        <PrimaryBtn onClick={onViewHaircuts}>View My Haircuts</PrimaryBtn>
        <GhostBtn onClick={onHome}>Back to Home</GhostBtn>
      </div>
    </div>
  )
}

// ── SaveFailureScreen ─────────────────────────────────────────────────────

function SaveFailureScreen({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col items-center px-5 pt-16 pb-8" style={{ background: 'var(--background)' }}>
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(229,115,115,0.1)', border: '2px solid rgba(229,115,115,0.3)' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M14 9v7M14 19.5v.5" stroke="#e57373" strokeWidth="2" strokeLinecap="round" /><circle cx="14" cy="14" r="11" stroke="#e57373" strokeWidth="1.5" /></svg>
      </div>
      <h2 className="font-display text-2xl mb-3 text-center" style={{ color: 'var(--foreground)' }}>Save failed</h2>
      <p className="text-sm text-center leading-relaxed mb-4" style={{ color: 'var(--muted-foreground)', maxWidth: 290 }}>
        Something went wrong. Your brief and selections are still here — you haven't lost anything.
      </p>
      <SimBadge label="Simulated Save" />
      <div className="w-full mt-auto space-y-3">
        <PrimaryBtn onClick={onRetry}>Retry Save</PrimaryBtn>
        <GhostBtn onClick={onBack}>Back to Brief</GhostBtn>
      </div>
    </div>
  )
}

// ── MyHaircutsScreen ──────────────────────────────────────────────────────

function MyHaircutsScreen({
  savedHaircuts, onReopenBrief, onRepeat, onNewHaircut, onBack,
  deleteConfirmId, setDeleteConfirmId, onConfirmDelete,
}: {
  savedHaircuts: SavedHaircut[]
  onReopenBrief: (id: string) => void
  onRepeat: (id: string) => void
  onNewHaircut: () => void
  onBack: () => void
  deleteConfirmId: string | null
  setDeleteConfirmId: (id: string | null) => void
  onConfirmDelete: (id: string) => void
}) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-5 flex-shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <BackBtn onBack={onBack} />
        <div className="flex-1">
          <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>My Haircuts</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Your best haircut, remembered</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
        {savedHaircuts.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16 pb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M16 8v8M16 20v.5M8 28h16a2 2 0 002-2V10l-6-6H8a2 2 0 00-2 2v20a2 2 0 002 2z" stroke="var(--muted-foreground)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="font-display text-xl mb-2" style={{ color: 'var(--foreground)' }}>No saved haircuts yet</h3>
            <p className="text-sm leading-relaxed mb-8" style={{ color: 'var(--muted-foreground)', maxWidth: 260 }}>
              Complete the journey and save your brief — reopen it any time to show your barber.
            </p>
            <PrimaryBtn onClick={onNewHaircut}>Start Your Transformation</PrimaryBtn>
          </div>
        ) : (
          <div className="space-y-3">
            {savedHaircuts.map(hc => {
              const style: HairstyleItem = hc.rec ??
                (hc.hairstyleId !== undefined ? DEMO_FIXTURE_HAIRSTYLES.find(h => h.id === hc.hairstyleId) : undefined) ??
                {
                  id: hc.hairstyleId ?? 0,
                  backendId: hc.backendId,
                  name: hc.hairstyleName || hc.name || 'Saved Hairstyle',
                  description: 'Saved hairstyle brief',
                  reason: 'Saved custom recommendation',
                  reasonEvidence: [],
                  effort: 'Medium',
                  effortDetail: 'Custom styling',
                  limitation: 'Consult barber for specifics',
                  bestMatch: false,
                  previewPortrait: portrait1,
                  top: 'Custom length',
                  sides: 'Tapered sides',
                  back: 'Tapered neckline',
                  fade: 'Custom taper',
                  styling: 'Style as desired',
                }
              return (
                <div
                  key={hc.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}
                >
                  <div className="flex gap-3 p-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={hc.previewImageUrl || style.previewPortrait} alt={hc.name} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="font-medium text-sm truncate" style={{ color: 'var(--foreground)' }}>{hc.name}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted-foreground)' }}>{style.name}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)', opacity: 0.65 }}>{hc.date}</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmId(hc.id)}
                      aria-label="Delete"
                      className="flex items-center justify-center w-9 h-9 rounded-lg flex-shrink-0 self-start mt-0.5 transition-all active:scale-90"
                      style={{ background: 'rgba(229,115,115,0.08)', border: '1px solid rgba(229,115,115,0.15)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M6 4V3h4v1M5 4l1 9h4l1-9" stroke="#e57373" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2 px-3 pb-3">
                    <button
                      onClick={() => onReopenBrief(hc.id)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: '#c9a96e', color: '#080c14', minHeight: 40 }}
                    >
                      Show My Barber
                    </button>
                    <button
                      onClick={() => onRepeat(hc.id)}
                      className="flex-1 py-2.5 rounded-lg text-xs font-medium transition-all active:scale-95"
                      style={{ background: 'rgba(201,169,110,0.1)', color: '#c9a96e', border: '1px solid rgba(201,169,110,0.25)', minHeight: 40 }}
                    >
                      Repeat This Cut
                    </button>
                  </div>
                </div>
              )
            })}
            <button
              onClick={onNewHaircut}
              className="w-full py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98] mt-2"
              style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 52 }}
            >
              + Find Another Haircut
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation bottom sheet */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          style={{ background: 'rgba(8,12,20,0.82)', backdropFilter: 'blur(4px)' }}
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-full px-5 pb-10 pt-6 rounded-t-2xl sheet-enter"
            style={{ background: 'var(--card)', borderTop: '1px solid var(--border)', maxWidth: 390, margin: '0 auto' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(240,235,224,0.18)' }} />
            <h3 className="font-display text-xl mb-2" style={{ color: 'var(--foreground)' }}>Delete this haircut?</h3>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
              The saved brief and stored images will be permanently removed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <GhostBtn onClick={() => setDeleteConfirmId(null)}>Cancel</GhostBtn>
              <button
                onClick={() => { onConfirmDelete(deleteConfirmId!); setDeleteConfirmId(null) }}
                className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
                style={{ background: 'rgba(229,115,115,0.75)', color: '#fff', minHeight: 48 }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

let globalFaceDetector: FaceDetector | null = null;

async function getMediapipeFaceDetector() {
  if (globalFaceDetector) return globalFaceDetector;
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  globalFaceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
      delegate: "GPU"
    },
    runningMode: "IMAGE"
  });
  return globalFaceDetector;
}

async function normalizePhoto(fileOrUrl: Blob | string): Promise<{ blob: Blob, url: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      console.log('--- DEBUG: normalizePhoto ---');
      console.log('Original image dimensions:', { width: img.width, height: img.height });

      let faceBox: any = null;
      let usedFaceDetector = false;

      try {
        console.log('Initializing MediaPipe FaceDetector...');
        const detector = await getMediapipeFaceDetector();
        const detections = detector.detect(img);

        console.log('MediaPipe FaceDetector found faces:', detections.detections.length);
        if (detections.detections.length > 0) {
          const det = detections.detections[0];
          if (det.boundingBox) {
            faceBox = {
              x: det.boundingBox.originX,
              y: det.boundingBox.originY,
              width: det.boundingBox.width,
              height: det.boundingBox.height
            };
            usedFaceDetector = true;
            console.log('Detected face bounding box:', faceBox);
          }
        }
      } catch (e) {
        console.warn('MediaPipe FaceDetector failed:', e);
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas error'));

      // Determine face coordinates (real or heuristic)
      let faceW, faceH, faceX, faceY;
      if (faceBox) {
        faceW = faceBox.width;
        faceH = faceBox.height;
        faceX = faceBox.x;
        faceY = faceBox.y;
      } else {
        // Fallback: assume face is in upper center, ~35% of the shorter dimension
        const minDim = Math.min(img.width, img.height);
        faceW = minDim * 0.35;
        faceH = faceW * 1.25;
        faceX = (img.width - faceW) / 2;
        faceY = img.height * 0.15; // typically face is near the top
        console.log('Using heuristic face box:', { x: faceX, y: faceY, width: faceW, height: faceH });
      }

      // Calculate tight head crop (1.4x face width, 2.1x face height)
      // Top margin: 80% face height (for hair)
      // Bottom margin: 30% face height (for neck)

      let tightW = faceW * 1.4;
      let tightH = faceH * 2.1;
      let tightX = (faceX + faceW / 2) - (tightW / 2);
      let tightY = faceY - (faceH * 0.8);

      console.log('tightCrop initial:', { x: tightX, y: tightY, width: tightW, height: tightH });

      // Strict boundary clamp (do not expand, just cut off what's outside the image)
      if (tightX < 0) {
        tightW += tightX; // reduce width by the amount it was out of bounds
        tightX = 0;
      }
      if (tightY < 0) {
        tightH += tightY;
        tightY = 0;
      }
      if (tightX + tightW > img.width) {
        tightW = img.width - tightX;
      }
      if (tightY + tightH > img.height) {
        tightH = img.height - tightY;
      }

      console.log('Final tightCrop applied:', { x: tightX, y: tightY, width: tightW, height: tightH });

      // We use the tight crop dimensions directly for the canvas. 
      // The CSS object-fit: cover in the UI will handle displaying it in a 3:4 box if needed.
      canvas.width = tightW;
      canvas.height = tightH;
      console.log('Final canvas (normalizedPhoto) dimensions:', { width: canvas.width, height: canvas.height });

      ctx.drawImage(img, tightX, tightY, tightW, tightH, 0, 0, tightW, tightH);

      // Save debug snapshot to window for manual inspection in console if needed
      (window as any).__lastDebugCropCanvas = canvas;

      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Blob error'));
        resolve({ blob, url: URL.createObjectURL(blob) });
      }, 'image/jpeg', 0.9);
    };
    img.onerror = reject;
    if (typeof fileOrUrl === 'string') {
      img.src = fileOrUrl;
    } else {
      img.src = URL.createObjectURL(fileOrUrl);
    }
  });
}

function RecommendationsUnavailableScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col px-5 pt-12 pb-8" style={{ background: 'var(--background)' }}>
      <BackBtn onBack={onBack} />
      <div className="flex-1 flex flex-col items-center justify-center text-center pt-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.25)' }}>
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="11" stroke="#c9a96e" strokeWidth="1.5" strokeDasharray="3 3"/><path d="M14 9v6M14 19v.5" stroke="#c9a96e" strokeWidth="2" strokeLinecap="round"/></svg>
        </div>
        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--foreground)' }}>No Haircut Selected</h2>
        <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--muted-foreground)', maxWidth: 280 }}>
          No hairstyle recommendation is currently selected or available. Please return to recommendations.
        </p>
      </div>
      <div className="space-y-3">
        <PrimaryBtn onClick={onBack}>Back to Recommendations</PrimaryBtn>
      </div>
    </div>
  )
}

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')


  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [normalizedPhoto, setNormalizedPhoto] = useState<string | null>(null)
  const activeObjectUrlRef = useRef<string | null>(null)

  function setSafePhoto(url: string | null) {
    if (activeObjectUrlRef.current && activeObjectUrlRef.current !== url && activeObjectUrlRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(activeObjectUrlRef.current)
      activeObjectUrlRef.current = null
    }
    if (url && url.startsWith('blob:')) {
      activeObjectUrlRef.current = url
    }
    setSelectedPhoto(url)
  }

  useEffect(() => {
    return () => {
      if (activeObjectUrlRef.current && activeObjectUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(activeObjectUrlRef.current)
      }
    }
  }, [])
  const [consent, setConsent] = useState(false)
  const [revisionId, setRevisionId] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [prefs, setPrefs] = useState<Prefs>({ vibe: '', length: '', effort: '', notes: '' })

  const [recommendations, setRecommendations] = useState<HairstyleItem[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [recsError, setRecsError] = useState<string | null>(null)

  const [activeRec, setActiveRec] = useState(0)
  const [chosenRec, setChosenRec] = useState<number | null>(null)

  const [previewMode, setPreviewMode] = useState<'original' | 'possible'>('original')
  const [previewAvail, setPreviewAvail] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const [briefNotes, setBriefNotes] = useState('')

  const [saveName, setSaveName] = useState('')

  const [savedHaircuts, setSavedHaircuts] = useState<SavedHaircut[]>([])
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    get('cutback_haircuts').then((data: SavedHaircut[]) => {
      if (data) setSavedHaircuts(data)
    }).catch(console.error)
  }, [])

  const photo = selectedPhoto ?? portrait1
  const analysisPhoto = normalizedPhoto ?? photo
  const currentChosenHairstyle = (chosenRec !== null && recommendations[chosenRec])
    ? recommendations[chosenRec]
    : (recommendations[0] ?? null)

  async function handleSave() {
    const rec = currentChosenHairstyle
    if (!rec) return
    const id = Math.random().toString(36).slice(2)

    let photoBlob: Blob | undefined = undefined
    if (selectedPhoto) {
      try {
        const fetchRes = await fetch(selectedPhoto)
        photoBlob = await fetchRes.blob()
      } catch (err) {
        console.warn('[handleSave] Failed to convert selectedPhoto to Blob:', err)
      }
    }

    setSavedHaircuts(prev => {
      const newArr = [{
        id,
        name: saveName.trim() || rec.name,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        hairstyleId: rec.id,
        backendId: rec.backendId,
        hairstyleName: rec.name,
        previewImageUrl: previewImageUrl || undefined,
        rec,
        originalPhotoUrl: selectedPhoto || undefined,
        originalPhotoBlob: photoBlob,
      }, ...prev];
      set('cutback_haircuts', newArr).catch(console.error);
      return newArr;
    })
    setScreen('save-success')
  }

  function handleSaveFail() {
    setScreen('save-failure')
  }

  function handleReopenBrief(id: string) {
    const hc = savedHaircuts.find(h => h.id === id)
    if (!hc) return

    if (hc.originalPhotoBlob instanceof Blob) {
      const freshUrl = URL.createObjectURL(hc.originalPhotoBlob)
      setSafePhoto(freshUrl)
    } else if (hc.originalPhotoUrl && !hc.originalPhotoUrl.startsWith('blob:')) {
      // Non-blob legacy URL (e.g. data: URI, http URL, or bundled asset import)
      setSafePhoto(hc.originalPhotoUrl)
    } else {
      // Legacy dead blob URL or missing photo: fallback gracefully to bundled portrait1 without crashing
      setSafePhoto(null)
    }

    setPreviewImageUrl(hc.previewImageUrl || null)
    setPreviewAvail(!!hc.previewImageUrl)

    if (hc.rec) {
      setRecommendations(prev => {
        // If the item exists in current recommendations by backendId or name, find its index
        const existingIdx = prev.findIndex(r => (hc.rec?.backendId && r.backendId === hc.rec?.backendId) || r.name === hc.rec?.name);
        if (existingIdx !== -1) {
          setChosenRec(existingIdx);
          const arr = [...prev];
          arr[existingIdx] = hc.rec!;
          return arr;
        } else {
          // Put the saved rec at the saved hairstyleId or append it safely
          const targetIdx = typeof hc.hairstyleId === 'number' && hc.hairstyleId >= 0 && hc.hairstyleId < 10 ? hc.hairstyleId : 0;
          setChosenRec(targetIdx);
          const arr = [...prev];
          arr[targetIdx] = hc.rec!;
          return arr;
        }
      })
    } else {
      setChosenRec(hc.hairstyleId ?? 0);
    }

    setScreen('barber-brief')
  }

  function handleRepeat(id: string) {
    const hc = savedHaircuts.find(h => h.id === id)
    if (!hc) return

    if (hc.originalPhotoBlob instanceof Blob) {
      const freshUrl = URL.createObjectURL(hc.originalPhotoBlob)
      setSafePhoto(freshUrl)
    } else if (hc.originalPhotoUrl && !hc.originalPhotoUrl.startsWith('blob:')) {
      setSafePhoto(hc.originalPhotoUrl)
    } else {
      setSafePhoto(null)
    }

    setPreviewImageUrl(hc.previewImageUrl || null)
    setPreviewAvail(!!hc.previewImageUrl)

    if (hc.rec) {
      setRecommendations(prev => {
        const existingIdx = prev.findIndex(r => (hc.rec?.backendId && r.backendId === hc.rec?.backendId) || r.name === hc.rec?.name);
        if (existingIdx !== -1) {
          setChosenRec(existingIdx);
          const arr = [...prev];
          arr[existingIdx] = hc.rec!;
          return arr;
        } else {
          const targetIdx = typeof hc.hairstyleId === 'number' && hc.hairstyleId >= 0 && hc.hairstyleId < 10 ? hc.hairstyleId : 0;
          setChosenRec(targetIdx);
          const arr = [...prev];
          arr[targetIdx] = hc.rec!;
          return arr;
        }
      })
    } else {
      setChosenRec(hc.hairstyleId ?? 0);
    }

    setBriefNotes('')
    setScreen('barber-brief')
  }

  function handleConfirmDelete(id: string) {
    setSavedHaircuts(prev => {
      const newArr = prev.filter(h => h.id !== id);
      set('cutback_haircuts', newArr).catch(console.error);
      return newArr;
    })
  }

  async function loadRecommendations(prefsToUse = prefs, passedAnalysisData?: AnalysisData | null) {
    if (!revisionId) {
      setScreen('recommendations')
      return
    }

    setRecsLoading(true)
    setRecsError(null)
    setScreen('recommendations')

    try {
      const payload: RecommendationPreferencesInput = {
        vibe: prefsToUse.vibe || undefined,
        desiredLength: prefsToUse.length || undefined,
        stylingEffort: prefsToUse.effort || undefined,
        note: prefsToUse.notes ? prefsToUse.notes.slice(0, 500) : undefined,
      }

      const res = await fetchRecommendations(revisionId, payload)
      const dataForMapping = passedAnalysisData !== undefined ? passedAnalysisData : analysisData

      if (res.route === 'SUCCESS') {
        if (res.recommendations?.recommendations?.length) {
          const mapped = mapBackendRecommendations(res.recommendations.recommendations, dataForMapping, prefsToUse)
          setRecommendations(mapped)
          setActiveRec(0)
          setChosenRec(null)
        } else {
          setRecommendations([])
        }
      } else {
        setRecsError(res.message || 'Could not generate recommendations.')
      }
    } catch (err: any) {
      setRecsError(err.message || 'Network error connecting to recommendation service.')
    } finally {
      setRecsLoading(false)
    }
  }

  function resetFlow() {
    setSafePhoto(null)
    setNormalizedPhoto(null)
    setConsent(false)
    setRevisionId(null)
    setAnalysisData(null)
    setAnalysisError(null)
    setRecommendations([])
    setRecsLoading(false)
    setRecsError(null)
    setPrefs({ vibe: '', length: '', effort: '', notes: '' })
    setActiveRec(0)
    setChosenRec(null)
    setPreviewAvail(false)
    setPreviewImageUrl(null)
    setPreviewError(null)
    setPreviewMode('original')
    setBriefNotes('')
    setSaveName('')
  }

  return (
    <div
      className="relative mx-auto overflow-hidden"
      style={{
        maxWidth: 390,
        minHeight: '100dvh',
        background: 'var(--background)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {screen === 'home' && (
        <HomeScreen
          onStart={() => setScreen('upload')}
          onMyHaircuts={() => setScreen('my-haircuts')}
        />
      )}

      {screen === 'upload' && (
        <UploadScreen
          onBack={() => setScreen('home')}
          consent={consent}
          setConsent={setConsent}
          selectedPhoto={selectedPhoto}
          setSelectedPhoto={setSelectedPhoto}
          onUploadSuccess={(id, normUrl) => {
            setRevisionId(id)
            if (normUrl) setNormalizedPhoto(normUrl)
          }}
          onContinue={() => setScreen('analysis-loading')}
        />
      )}

      {screen === 'analysis-loading' && (
        <AnalysisLoadingScreen
          photo={analysisPhoto}
          revisionId={revisionId}
          onComplete={(data) => {
            setAnalysisData(data)
            if (!data?.attributes) {
              setScreen('analysis-results')
            } else {
              loadRecommendations(prefs, data)
            }
          }}
          onFail={(msg) => {
            setAnalysisError(msg || 'Analysis failed.')
            setScreen('analysis-failure')
          }}
        />
      )}

      {screen === 'analysis-failure' && (
        <AnalysisFailureScreen
          photo={analysisPhoto}
          errorMessage={analysisError}
          onRetry={() => setScreen('analysis-loading')}
          onBack={() => setScreen('upload')}
        />
      )}

      {screen === 'analysis-results' && (
        <AnalysisResultsScreen
          photo={analysisPhoto}
          analysisData={analysisData}
          onPreferences={() => setScreen('preferences')}
          onRecommendations={() => loadRecommendations(prefs)}
          onBack={() => setScreen('upload')}
        />
      )}

      {screen === 'preferences' && (
        <CustomizeYourLookScreen
          initialPrefs={prefs}
          showSkip={true}
          onSkip={() => loadRecommendations(prefs)}
          onApply={(newPrefs) => {
            setPrefs(newPrefs)
            loadRecommendations(newPrefs)
          }}
          onBack={() => setScreen('recommendations')}
        />
      )}

      {screen === 'customize-look' && (
        <CustomizeYourLookScreen
          initialPrefs={prefs}
          onApply={(newPrefs) => {
            setPrefs(newPrefs)
            setScreen('recommendations')
          }}
          onBack={() => setScreen('recommendations')}
        />
      )}

      {screen === 'recommendations' && (
        <RecommendationsScreen
          photo={photo}
          prefs={prefs}
          recommendations={recommendations}
          analysisData={analysisData}
          loading={recsLoading}
          errorMessage={recsError}
          onRetry={() => loadRecommendations(prefs)}
          activeRec={activeRec}
          setActiveRec={setActiveRec}
          chosenRec={chosenRec}
          setChosenRec={setChosenRec}
          onSeePreview={() => {
            setPreviewMode('original')
            setPreviewError(null)
            setScreen('preview-loading')
          }}
          onCustomize={() => setScreen('customize-look')}
          onBack={() => setScreen('upload')}
        />
      )}

      {screen === 'preview-loading' && (
        currentChosenHairstyle ? (
          <PreviewLoadingScreen
            photo={photo}
            revisionId={revisionId}
            selectedHairstyle={currentChosenHairstyle}
            onComplete={(url) => {
              setPreviewImageUrl(url)
              setPreviewAvail(true)
              setPreviewError(null)
              setPreviewMode('possible')
              setScreen('preview')
            }}
            onFail={(errorMsg) => {
              setPreviewImageUrl(null)
              setPreviewAvail(false)
              setPreviewError(errorMsg || null)
              setScreen('preview-failure')
            }}
          />
        ) : (
          <RecommendationsUnavailableScreen onBack={() => setScreen('recommendations')} />
        )
      )}

      {screen === 'preview-failure' && (
        currentChosenHairstyle ? (
          <PreviewFailureScreen
            selectedHairstyle={currentChosenHairstyle}
            errorMessage={previewError}
            onRetry={() => {
              setPreviewMode('original')
              setPreviewError(null)
              setScreen('preview-loading')
            }}
            onContinueWithout={() => {
              setPreviewAvail(false)
              setPreviewImageUrl(null)
              setScreen('barber-brief')
            }}
            onBack={() => setScreen('recommendations')}
          />
        ) : (
          <RecommendationsUnavailableScreen onBack={() => setScreen('recommendations')} />
        )
      )}

      {screen === 'preview' && (
        currentChosenHairstyle ? (
          <PreviewScreen
            photo={photo}
            previewImageUrl={previewImageUrl}
            selectedHairstyle={currentChosenHairstyle}
            previewMode={previewMode}
            setPreviewMode={setPreviewMode}
            onContinue={() => setScreen('barber-brief')}
            onRetry={() => {
              setPreviewMode('original')
              setPreviewError(null)
              setScreen('preview-loading')
            }}
            onBack={() => setScreen('recommendations')}
          />
        ) : (
          <RecommendationsUnavailableScreen onBack={() => setScreen('recommendations')} />
        )
      )}

      {screen === 'barber-brief' && (
        currentChosenHairstyle ? (
          <BarberBriefScreen
            photo={photo}
            previewImageUrl={previewImageUrl}
            selectedHairstyle={currentChosenHairstyle}
            previewAvail={previewAvail}
            notes={briefNotes}
            setNotes={setBriefNotes}
            onSave={() => {
              setSaveName(currentChosenHairstyle.name)
              setScreen('save')
            }}
            onBack={() => setScreen(previewAvail ? 'preview' : 'recommendations')}
          />
        ) : (
          <RecommendationsUnavailableScreen onBack={() => setScreen('recommendations')} />
        )
      )}

      {screen === 'save' && (
        currentChosenHairstyle ? (
          <SaveScreen
            photo={photo}
            previewImageUrl={previewImageUrl}
            selectedHairstyle={currentChosenHairstyle}
            name={saveName}
            setName={setSaveName}
            onSave={handleSave}
            onFail={handleSaveFail}
            onBack={() => setScreen('barber-brief')}
          />
        ) : (
          <RecommendationsUnavailableScreen onBack={() => setScreen('recommendations')} />
        )
      )}

      {screen === 'save-success' && (
        <SaveSuccessScreen
          photo={photo}
          previewImageUrl={previewImageUrl}
          selectedHairstyle={currentChosenHairstyle}
          name={saveName}
          onViewHaircuts={() => setScreen('my-haircuts')}
          onHome={() => { resetFlow(); setScreen('home') }}
        />
      )}

      {screen === 'save-failure' && (
        <SaveFailureScreen
          onRetry={handleSave}
          onBack={() => setScreen('barber-brief')}
        />
      )}

      {screen === 'my-haircuts' && (
        <MyHaircutsScreen
          savedHaircuts={savedHaircuts}
          onReopenBrief={handleReopenBrief}
          onRepeat={handleRepeat}
          onNewHaircut={() => { resetFlow(); setScreen('upload') }}
          onBack={() => setScreen('home')}
          deleteConfirmId={deleteConfirmId}
          setDeleteConfirmId={setDeleteConfirmId}
          onConfirmDelete={handleConfirmDelete}
        />
      )}
    </div>
  )
}
