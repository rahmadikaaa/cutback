import { useState, useEffect, useRef } from 'react'
import portrait1 from './assets/portrait-1.jpg'
import portrait2 from './assets/portrait-2.png'
import portrait3 from './assets/portrait-3.png'
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
  previewImageUrl?: string
  rec?: HairstyleItem
  originalPhotoUrl?: string
}

// ── Data ──────────────────────────────────────────────────────────────────

export interface HairstyleItem {
  id: number
  backendId?: string
  name: string
  description: string
  reason: string
  reasonEvidence: { obs: string; contribution: string }[]
  effort: string
  effortDetail: string
  limitation: string
  bestMatch: boolean
  bestMatchReason?: string
  constraints?: string[]
  previewPortrait: string
  top: string
  sides: string
  back: string
  fade: string
  styling: string
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

    const evidence: { obs: string; contribution: string }[] = []

    if (rec.isBestMatch && rec.bestMatchReason) {
      evidence.push({ obs: 'Best Match', contribution: rec.bestMatchReason })
    }

    if (analysisData?.attributes?.faceShape && analysisData.attributes.faceShape !== 'unknown') {
      const face = analysisData.attributes.faceShape
      evidence.push({
        obs: `${face.charAt(0).toUpperCase() + face.slice(1)} face`,
        contribution: 'proportions naturally framed by this cut',
      })
    }

    if (analysisData?.attributes?.hairType && analysisData.attributes.hairType !== 'unknown') {
      const hair = analysisData.attributes.hairType
      evidence.push({
        obs: `${hair.charAt(0).toUpperCase() + hair.slice(1)} pattern`,
        contribution: 'works with natural movement',
      })
    }

    if (evidence.length === 0) {
      evidence.push({ obs: 'Feature alignment', contribution: 'harmonises with your facial structure' })
    }

    return {
      id: index,
      backendId: rec.id,
      name: rec.name,
      description: rec.description,
      reason: rec.reason,
      reasonEvidence: evidence,
      effort: effortCapitalized,
      effortDetail,
      limitation,
      bestMatch: rec.isBestMatch,
      bestMatchReason: rec.bestMatchReason,
      constraints: rec.constraints,
      previewPortrait: portraits[index % portraits.length],
      top: 'Customised length and texture for your hair',
      sides: 'Clean tapered finish to balance proportion',
      back: 'Tapered neckline to match overall shape',
      fade: 'Tailored transition suited to face structure',
      styling: `${effortCapitalized} effort: styling paste or light clay recommended`,
    }
  })
}

const HAIRSTYLES: HairstyleItem[] = [
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
  'Preparing photo…',
  'Analysing visible features…',
  'Reading hair characteristics…',
  'Building grounded recommendations…',
]

const ANALYSIS_OBS = [
  { label: 'Face shape', value: 'Oval', status: 'observed' },
  { label: 'Hair pattern', value: 'Natural wave', status: 'observed' },
  { label: 'Current length', value: 'Short-medium', status: 'observed' },
  { label: 'Volume', value: 'Moderate', status: 'observed' },
  { label: 'Hair thickness', value: 'Unknown', status: 'unknown' },
  { label: 'Texture', value: 'Fine-medium', status: 'observed' },
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
          className={`absolute right-0 top-[162px] overflow-hidden rounded-l-xl border-l transition-[width] duration-[240ms] ease-out ${
            isJourneyMinimized ? 'w-[68px]' : 'w-[142px]'
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
      <div className="flex items-center gap-3 px-5 pt-12 pb-5 flex-shrink-0">
        <BackBtn onBack={onBack} />
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>Your Photo</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>The start of your transformation</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
        {/* Photo guidance */}
        <div className="rounded-xl p-4" style={{ background: 'var(--secondary)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium mb-2 uppercase tracking-wide" style={{ color: '#c9a96e', fontSize: 10 }}>Photo Guide</p>
          <ul className="text-sm space-y-1" style={{ color: 'var(--secondary-foreground)' }}>
            {['One person, facing forward', 'Face and hair clearly visible', 'Even lighting — no harsh shadows', 'Recent photo works best'].map(g => (
              <li key={g} className="flex gap-1.5">
                <span style={{ color: 'rgba(240,235,224,0.3)' }}>·</span> {g}
              </li>
            ))}
          </ul>
        </div>

        {/* Upload status indicator */}
        <div className="flex items-center gap-2">
          <SimBadge label="Backend Upload" />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Select a sample photo or upload below</span>
        </div>

        {/* Sample photos */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Sample Photos</p>
          <div className="grid grid-cols-3 gap-2.5">
            {samples.map((photo, i) => (
              <button
                key={i}
                onClick={() => { setSelectedPhoto(photo); setSelectedFile(null); setError(null) }}
                aria-label={`Select sample photo ${i + 1}`}
                className="relative rounded-xl overflow-hidden transition-all active:scale-95"
                style={{
                  aspectRatio: '1',
                  outline: selectedPhoto === photo ? '2px solid #c9a96e' : '2px solid transparent',
                  outlineOffset: 2,
                }}
              >
                <img src={photo} alt={`Sample ${i + 1}`} className="w-full h-full object-cover object-top" />
                {selectedPhoto === photo && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(201,169,110,0.18)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#c9a96e' }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#080c14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Upload own */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full py-3.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
          style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 48 }}
        >
          + Upload or Take Your Own Photo
        </button>

        {/* Preview if selected */}
        {selectedPhoto && (
          <div className="rounded-xl overflow-hidden" style={{ height: 200, border: '1px solid var(--border)' }}>
            <img src={selectedPhoto} alt="Selected photo" className="w-full h-full object-cover object-top" />
          </div>
        )}

        {/* Consent */}
        <div
          className="rounded-xl p-4"
          style={{ background: 'var(--secondary)', border: error && !consent ? '1px solid rgba(229,115,115,0.45)' : '1px solid var(--border)' }}
        >
          <label className="flex gap-3 cursor-pointer">
            <div className="relative mt-0.5 flex-shrink-0" onClick={() => { setConsent(!consent); setError(null) }}>
              <div
                className="checkbox-inner w-5 h-5 rounded flex items-center justify-center"
                style={{
                  background: consent ? '#c9a96e' : 'transparent',
                  border: consent ? '2px solid #c9a96e' : '2px solid rgba(240,235,224,0.28)',
                }}
              >
                {consent && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M2 5.5L4.5 8L9 3" stroke="#080c14" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </div>
            <div onClick={() => { setConsent(!consent); setError(null) }}>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>I agree to photo processing</p>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                Your photo is used only for haircut recommendations and your personal preview. It is not shared publicly or used for model training.
              </p>
            </div>
          </label>
        </div>

        {error && (
          <p className="text-sm flex items-center gap-1.5" style={{ color: '#e57373' }}>
            <span>⚠</span> {error}
          </p>
        )}

        <PrimaryBtn onClick={handleContinue} disabled={!selectedPhoto || !consent || isUploading}>
          {isUploading ? 'Uploading & Validating…' : 'Continue'}
        </PrimaryBtn>
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
        onFail('No photo revision found. Please upload a photo first.')
        return
      }

      try {
        const res = await analyzePhoto(revisionId)

        if (!isMountedRef.current) return

        if (res.route === 'SUCCESS' && res.analysis) {
          onComplete(res.analysis)
        } else if (res.route === 'REUPLOAD') {
          onFail(res.message || 'Photo was not suitable for analysis. Please upload a clearer photo.')
        } else if (res.route === 'RETRY_REQUIRED') {
          onFail(res.message || 'Analysis temporarily failed. Please retry.')
        } else {
          onFail(res.message || 'Analysis could not be completed.')
        }
      } catch (err: any) {
        if (!isMountedRef.current) return
        onFail(err.message || 'Network error connecting to analysis service.')
      }
    }

    executeAnalysis()

    return () => clearInterval(interval)
  }, [revisionId])

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="relative flex-shrink-0" style={{ height: '54vh' }}>
        <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 55%, rgba(8,12,20,1) 100%)' }} />
        <div className="absolute top-12 left-5">
          <SimBadge label="AI Analysis" />
        </div>
      </div>
      <div className="px-5 pt-6 pb-8 flex flex-col gap-4">
        <div className="space-y-3">
          {ANALYSIS_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 transition-all duration-300" style={{ opacity: i <= step ? 1 : 0.22 }}>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: i < step ? '#c9a96e' : i === step ? 'rgba(201,169,110,0.15)' : 'var(--secondary)',
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
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map(i => <div key={i} className="loading-dot w-2 h-2 rounded-full" style={{ background: '#c9a96e' }} />)}
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
  const displayObs = analysisData?.attributes
    ? [
        {
          label: 'Face shape',
          value: formatAttrValue(analysisData.attributes.faceShape),
          status: analysisData.attributes.faceShape === 'unknown' ? 'unknown' : 'observed',
        },
        {
          label: 'Hair pattern',
          value: formatAttrValue(analysisData.attributes.hairType),
          status: analysisData.attributes.hairType === 'unknown' ? 'unknown' : 'observed',
        },
        {
          label: 'Current length',
          value: formatAttrValue(analysisData.attributes.hairLength),
          status: analysisData.attributes.hairLength === 'unknown' ? 'unknown' : 'observed',
        },
        {
          label: 'Hairline',
          value: formatAttrValue(analysisData.attributes.hairLine),
          status: analysisData.attributes.hairLine === 'unknown' ? 'unknown' : 'observed',
        },
        {
          label: 'Hair thickness',
          value: formatAttrValue(analysisData.attributes.hairThickness),
          status: analysisData.attributes.hairThickness === 'unknown' ? 'unknown' : 'observed',
        },
        {
          label: 'Visual Suitability',
          value: analysisData.visualSuitability.isValid ? 'Verified' : 'Flagged',
          status: analysisData.visualSuitability.isValid ? 'observed' : 'unknown',
        },
      ]
    : ANALYSIS_OBS

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
            <div key={i} className="rounded-xl p-3.5" style={{ background: obs.status === 'unknown' ? 'rgba(138,130,120,0.08)' : 'var(--secondary)', border: '1px solid var(--border)' }}>
              <p className="uppercase mb-1" style={{ color: obs.status === 'unknown' ? 'var(--muted-foreground)' : '#c9a96e', fontSize: 9, letterSpacing: '0.1em' }}>
                {obs.label}
              </p>
              <p className="text-sm font-medium" style={{ color: obs.status === 'unknown' ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                {obs.value}
              </p>
              {obs.status === 'unknown' && (
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

// ── PreferencesScreen ──────────────────────────────────────────────────────

function PreferencesScreen({
  prefs, setPrefs, onSkip, onApply, onBack,
}: { prefs: Prefs; setPrefs: (p: Prefs) => void; onSkip: () => void; onApply: () => void; onBack: () => void }) {
  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      <div className="flex items-center gap-3 px-5 pt-12 pb-5 flex-shrink-0">
        <BackBtn onBack={onBack} />
        <div>
          <h2 className="font-display text-2xl" style={{ color: 'var(--foreground)' }}>Your Direction</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>All optional — skip to see recommendations</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-6">
        {/* Vibe */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>How do you want to look?</p>
          <div className="flex flex-wrap gap-2">
            {VIBES.map(v => (
              <button
                key={v}
                onClick={() => setPrefs({ ...prefs, vibe: prefs.vibe === v ? '' : v })}
                className="px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95"
                style={{
                  background: prefs.vibe === v ? '#c9a96e' : 'var(--secondary)',
                  color: prefs.vibe === v ? '#080c14' : 'var(--foreground)',
                  border: prefs.vibe === v ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 44,
                }}
              >{v}</button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Length direction</p>
          <div className="flex gap-2">
            {LENGTHS.map(l => (
              <button
                key={l}
                onClick={() => setPrefs({ ...prefs, length: prefs.length === l ? '' : l })}
                className="flex-1 py-3 rounded-lg text-xs font-medium text-center transition-all active:scale-95"
                style={{
                  background: prefs.length === l ? '#c9a96e' : 'var(--secondary)',
                  color: prefs.length === l ? '#080c14' : 'var(--foreground)',
                  border: prefs.length === l ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 44,
                }}
              >{l}</button>
            ))}
          </div>
        </div>

        {/* Effort */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Daily styling effort</p>
          <div className="flex gap-2">
            {EFFORTS.map(e => (
              <button
                key={e.id}
                onClick={() => setPrefs({ ...prefs, effort: prefs.effort === e.id ? '' : e.id })}
                className="flex-1 py-3 rounded-lg text-center transition-all active:scale-95"
                style={{
                  background: prefs.effort === e.id ? '#c9a96e' : 'var(--secondary)',
                  color: prefs.effort === e.id ? '#080c14' : 'var(--foreground)',
                  border: prefs.effort === e.id ? '1px solid #c9a96e' : '1px solid var(--border)',
                  minHeight: 52,
                }}
              >
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs mt-0.5" style={{ opacity: 0.7 }}>{e.detail}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 10 }}>Anything else? (optional)</p>
          <textarea
            value={prefs.notes}
            onChange={e => { if (e.target.value.length <= 500) setPrefs({ ...prefs, notes: e.target.value }) }}
            placeholder="E.g. 'want to try something different' or 'my barber always cuts it too short'"
            rows={3}
            className="w-full rounded-xl p-4 text-sm resize-none"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', fontFamily: 'var(--font-sans)', minHeight: 88 }}
          />
          <p className="text-xs mt-1 text-right" style={{ color: 'var(--muted-foreground)' }}>{prefs.notes.length}/500</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={onSkip}
            className="flex-1 py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            style={{ background: 'var(--secondary)', color: 'var(--foreground)', border: '1px solid var(--border)', minHeight: 52 }}
          >Skip</button>
          <button
            onClick={onApply}
            className="flex-[2] py-4 rounded-xl font-medium text-sm transition-all active:scale-[0.98]"
            style={{ background: '#c9a96e', color: '#080c14', minHeight: 52 }}
          >Apply & See Recommendations</button>
        </div>
      </div>
    </div>
  )
}

// ── RecommendationsScreen ──────────────────────────────────────────────────

// Evidence chain — grounded in observed + intent
function ConvergeChain({ rec, prefs, animKey }: { rec: HairstyleItem; prefs: Prefs; animKey: number }) {
  const intentItems = [
    prefs.vibe ? `Vibe: ${prefs.vibe}` : null,
    prefs.effort ? `Effort: ${prefs.effort}` : null,
    prefs.length ? `Length: ${prefs.length}` : null,
  ].filter(Boolean) as string[]

  return (
    <div key={`c-${animKey}`} className="converge-enter rounded-xl p-4 mb-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <p className="uppercase mb-3" style={{ color: 'var(--muted-foreground)', fontSize: 9, letterSpacing: '0.12em' }}>Why this works for you</p>

      {/* Evidence rows */}
      <div className="space-y-1.5 mb-3">
        {rec.reasonEvidence.map((e, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(201,169,110,0.55)' }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-medium" style={{ color: '#c9a96e' }}>{e.obs}</span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> — {e.contribution}</span>
            </div>
          </div>
        ))}
        {intentItems.length > 0 && intentItems.map((item, i) => (
          <div key={`intent-${i}`} className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-1 w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(240,235,224,0.25)' }} />
            <div className="flex-1 min-w-0">
              <span className="text-xs" style={{ color: 'rgba(240,235,224,0.55)' }}>{item}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Arrow + result */}
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
          <path d="M2 7h10M8 3l4 4-4 4" stroke="#c9a96e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{rec.reason}</p>
      </div>
    </div>
  )
}

function RecommendationsScreen({
  photo,
  prefs,
  recommendations,
  loading,
  errorMessage,
  onRetry,
  activeRec,
  setActiveRec,
  chosenRec,
  setChosenRec,
  onSeePreview,
  onBack,
}: {
  photo: string
  prefs: Prefs
  recommendations: HairstyleItem[]
  loading: boolean
  errorMessage: string | null
  onRetry: () => void
  activeRec: number
  setActiveRec: (i: number) => void
  chosenRec: number | null
  setChosenRec: (i: number | null) => void
  onSeePreview: () => void
  onBack: () => void
}) {
  const [animKey, setAnimKey] = useState(0)

  if (loading) {
    return (
      <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
        <div className="relative flex-shrink-0" style={{ height: '52vh' }}>
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

  const list = recommendations.length > 0 ? recommendations : HAIRSTYLES
  const safeActiveRec = Math.min(activeRec, list.length - 1)
  const rec = list[safeActiveRec]
  const isActive = chosenRec === safeActiveRec
  const hasChosen = chosenRec !== null

  function go(dir: 1 | -1) {
    setAnimKey(k => k + 1)
    setActiveRec((safeActiveRec + dir + list.length) % list.length)
  }

  return (
    <div className="screen-enter min-h-dvh flex flex-col" style={{ background: 'var(--background)' }}>
      {/* Portrait anchor — user identity stays locked */}
      <div className="relative flex-shrink-0" style={{ height: '52vh' }}>
        <img src={photo} alt="Your photo" className="w-full h-full object-cover object-top" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(8,12,20,0.52) 0%, transparent 25%, rgba(8,12,20,0.72) 70%, rgba(8,12,20,1) 100%)' }} />

        {/* Nav row */}
        <div className="absolute top-12 left-5 right-5 flex items-center justify-between">
          <BackBtn onBack={onBack} />
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium" style={{ color: 'rgba(240,235,224,0.55)' }}>
              {safeActiveRec + 1} / {list.length}
            </span>
            <ProgressDots total={list.length} active={safeActiveRec} chosen={chosenRec} />
          </div>
        </div>

        {/* Animated name overlay */}
        <div className="absolute bottom-0 left-5 right-5 pb-3">
          <div key={animKey} className="rec-content">
            {rec.bestMatch && (
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
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
            <h2 className="font-display text-[32px] leading-tight" style={{ color: 'var(--foreground)' }}>{rec.name}</h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(240,235,224,0.55)' }}>{rec.description}</p>
          </div>
        </div>
      </div>

      {/* Info + CTAs */}
      <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
        {/* CONVERGE: grounded reasoning chain */}
        <ConvergeChain rec={rec} prefs={prefs} animKey={animKey} />

        {/* Effort + limitation row */}
        <div key={`i-${animKey}`} className="rec-content flex gap-2.5 mb-4">
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

        {/* Previous / Choose This / Next */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => go(-1)}
            aria-label="Previous recommendation"
            className="flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', width: 48, height: 48, flexShrink: 0, minWidth: 48 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 5L7.5 10L12.5 15" stroke="#f0ebe0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => setChosenRec(isActive ? null : safeActiveRec)}
            className="flex-1 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              background: isActive ? 'rgba(201,169,110,0.14)' : 'var(--secondary)',
              color: isActive ? '#c9a96e' : 'var(--foreground)',
              border: isActive ? '1px solid rgba(201,169,110,0.45)' : '1px solid var(--border)',
              minHeight: 48,
            }}
          >
            {isActive ? '✓ Selected' : 'Select This Cut'}
          </button>

          <button
            onClick={() => go(1)}
            aria-label="Next recommendation"
            className="flex items-center justify-center rounded-xl transition-all active:scale-90"
            style={{ background: 'var(--secondary)', border: '1px solid var(--border)', width: 48, height: 48, flexShrink: 0, minWidth: 48 }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M7.5 5L12.5 10L7.5 15" stroke="#f0ebe0" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Preview CTA — revealed after choosing, with clear intent label */}
        <div
          style={{
            maxHeight: hasChosen ? 120 : 0,
            opacity: hasChosen ? 1 : 0,
            overflow: 'hidden',
            transition: 'max-height 400ms cubic-bezier(0.22,1,0.36,1), opacity 320ms ease',
          }}
        >
          <div className="pt-1 pb-0.5 px-0.5 rounded-xl mt-1" style={{ background: 'rgba(201,169,110,0.07)', border: '1px solid rgba(201,169,110,0.18)' }}>
            <p className="text-xs text-center pt-3 pb-2 px-4" style={{ color: 'rgba(240,235,224,0.5)' }}>
              Your personal preview is generated only for the selected cut
            </p>
            <button
              onClick={onSeePreview}
              className="w-full py-4 rounded-xl font-medium text-base transition-all active:scale-[0.98]"
              style={{ background: '#c9a96e', color: '#080c14', minHeight: 56 }}
            >
              Try This Look — Preview on Me
            </button>
          </div>
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

  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const onFailRef = useRef(onFail)
  onFailRef.current = onFail

  useEffect(() => {
    let cancelled = false
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

        // 1. Select hairstyle on backend to set state to READY_FOR_PREVIEW
        await selectHairstyle(revisionId, hairstyleId)
        if (cancelled) return

        // 2. Generate preview via AI backend
        const res = await generatePreview(revisionId, hairstyleId)
        if (cancelled) return

        if (res.route === 'SUCCESS' && res.previewImageUrl) {
          onCompleteRef.current(res.previewImageUrl)
        } else {
          onFailRef.current(res.message || 'AI preview generation failed.')
        }
      } catch (err: any) {
        if (cancelled) return
        onFailRef.current(err.message || 'Failed to connect to preview service.')
      }
    }

    runGeneration()

    return () => {
      cancelled = true
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
  const UNKNOWNS = ['Exact fade height (confirm with barber)', 'Parting preference if applicable']

  const rows = [
    { label: 'Top', value: rec.top },
    { label: 'Sides', value: rec.sides },
    { label: 'Back', value: rec.back },
    { label: 'Fade / Taper', value: rec.fade },
    { label: 'Styling', value: rec.styling },
  ]

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
            onClick={() => {}}
          >
            Show My Barber
          </button>
          <GhostBtn onClick={onSave}>Save This Haircut</GhostBtn>
        </div>
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
              const style = hc.rec ?? HAIRSTYLES.find(h => h.id === hc.hairstyleId) ?? HAIRSTYLES[0]
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

// ── Main App ───────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')


  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [normalizedPhoto, setNormalizedPhoto] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [revisionId, setRevisionId] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  const [prefs, setPrefs] = useState<Prefs>({ vibe: '', length: '', effort: '', notes: '' })

  const [recommendations, setRecommendations] = useState<HairstyleItem[]>(HAIRSTYLES)
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
  const currentChosenHairstyle = recommendations[chosenRec ?? 0] ?? HAIRSTYLES[0]

  function handleSave() {
    const rec = currentChosenHairstyle
    const id = Math.random().toString(36).slice(2)
    setSavedHaircuts(prev => {
      const newArr = [{
        id,
        name: saveName.trim() || rec.name,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        hairstyleId: rec.id,
        previewImageUrl: previewImageUrl || undefined,
        rec,
        originalPhotoUrl: selectedPhoto || undefined
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
    if (hc.originalPhotoUrl) setSelectedPhoto(hc.originalPhotoUrl)
    setChosenRec(hc.hairstyleId)
    setPreviewImageUrl(hc.previewImageUrl || null)
    setPreviewAvail(!!hc.previewImageUrl)
    
    if (hc.rec) {
      setRecommendations(prev => {
        const arr = [...prev]
        arr[hc.hairstyleId] = hc.rec!
        return arr
      })
    }
    
    setScreen('barber-brief')
  }

  function handleRepeat(id: string) {
    const hc = savedHaircuts.find(h => h.id === id)
    if (!hc) return
    if (hc.originalPhotoUrl) setSelectedPhoto(hc.originalPhotoUrl)
    setChosenRec(hc.hairstyleId)
    setPreviewImageUrl(hc.previewImageUrl || null)
    setPreviewAvail(!!hc.previewImageUrl)
    
    if (hc.rec) {
      setRecommendations(prev => {
        const arr = [...prev]
        arr[hc.hairstyleId] = hc.rec!
        return arr
      })
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

  async function loadRecommendations(prefsToUse = prefs) {
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

      if (res.route === 'SUCCESS' && res.recommendations?.recommendations?.length) {
        const mapped = mapBackendRecommendations(res.recommendations.recommendations, analysisData, prefsToUse)
        setRecommendations(mapped)
        setActiveRec(0)
        setChosenRec(null)
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
    setSelectedPhoto(null)
    setNormalizedPhoto(null)
    setConsent(false)
    setRevisionId(null)
    setAnalysisData(null)
    setAnalysisError(null)
    setRecommendations(HAIRSTYLES)
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
            setScreen('analysis-results')
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
        <PreferencesScreen
          prefs={prefs}
          setPrefs={setPrefs}
          onSkip={() => loadRecommendations(prefs)}
          onApply={() => loadRecommendations(prefs)}
          onBack={() => setScreen('analysis-results')}
        />
      )}

      {screen === 'recommendations' && (
        <RecommendationsScreen
          photo={photo}
          prefs={prefs}
          recommendations={recommendations}
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
          onBack={() => setScreen('analysis-results')}
        />
      )}

      {screen === 'preview-loading' && (
        <PreviewLoadingScreen
          photo={photo}
          revisionId={revisionId}
          selectedHairstyle={currentChosenHairstyle}
          onComplete={(url) => {
            setPreviewImageUrl(url)
            setPreviewAvail(true)
            setPreviewError(null)
            setScreen('preview')
          }}
          onFail={(errorMsg) => {
            setPreviewImageUrl(null)
            setPreviewAvail(false)
            setPreviewError(errorMsg || null)
            setScreen('preview-failure')
          }}
        />
      )}

      {screen === 'preview-failure' && (
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
      )}

      {screen === 'preview' && (
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
      )}

      {screen === 'barber-brief' && (
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
      )}

      {screen === 'save' && (
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
