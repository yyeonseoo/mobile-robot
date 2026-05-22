import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

const FILTER_BASE = `${import.meta.env.BASE_URL}filters/`

type FilterChoice =
  | { id: 'none'; label: string; icon: string }
  | { id: 'filter-1' | 'filter-2'; label: string; img: string }

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  x: number,
  y: number,
  width: number,
  height: number
) {
  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = width / height
  let drawWidth = width
  let drawHeight = height
  let drawX = x
  let drawY = y

  if (sourceRatio > targetRatio) {
    drawWidth = height * sourceRatio
    drawX = x + (width - drawWidth) / 2
  } else {
    drawHeight = width / sourceRatio
    drawY = y + (height - drawHeight) / 2
  }

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawFallbackOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  filterId: string
) {
  if (filterId === 'none') return

  ctx.save()
  ctx.fillStyle = 'rgba(13, 22, 54, 0.92)'
  ctx.fillRect(0, height * 0.08, width, height * 0.08)
  ctx.fillRect(0, height * 0.84, width, height * 0.08)

  ctx.fillStyle = filterId === 'filter-1' ? '#81c784' : '#9575cd'
  ctx.beginPath()
  ctx.arc(width * 0.18, height * 0.26, width * 0.1, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = filterId === 'filter-1' ? '#ffb74d' : '#f48fb1'
  ctx.beginPath()
  ctx.arc(width * 0.76, height * 0.7, width * 0.12, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
  ctx.font = `${Math.max(18, Math.round(width * 0.05))}px sans-serif`
  ctx.fillText(filterId === 'filter-1' ? 'FILTER 1' : 'FILTER 2', width * 0.05, height * 0.18)
  ctx.restore()
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function isAbortPlayError(e: unknown): boolean {
  return e instanceof DOMException && e.name === 'AbortError'
}

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraEpochRef = useRef(0)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const slotRefs = useRef<(HTMLDivElement | null)[]>([])
  const [liveOverlay, setLiveOverlay] = useState({ top: 0, height: 0, width: 0 })
  const completedStripRef = useRef('')
  const [err, setErr] = useState(() =>
    typeof navigator !== 'undefined' && !navigator.mediaDevices?.getUserMedia
      ? '이 브라우저는 카메라를 지원하지 않습니다.'
      : ''
  )
  const [selectedFilter, setSelectedFilter] = useState<string>('filter-1')
  const [shots, setShots] = useState<(string | null)[]>([null, null, null, null])
  const [recent, setRecent] = useState<string[]>([])
  const [missingFilters, setMissingFilters] = useState<Record<string, boolean>>({})

  const filterChoices = useMemo<FilterChoice[]>(
    () => [
      { id: 'none', label: '없음', icon: 'block' },
      { id: 'filter-1', label: '필터 1', img: `${FILTER_BASE}filter_overlay1.png` },
      { id: 'filter-2', label: '필터 2', img: `${FILTER_BASE}filter_overlay2.png` },
    ],
    []
  )

  const nextShotIndex = useMemo(() => {
    const idx = shots.findIndex((x) => !x)
    return idx < 0 ? 0 : idx
  }, [shots])

  const showLivePreview = shots[nextShotIndex] === null

  const selectedFilterChoice = useMemo(
    () => filterChoices.find((filter) => filter.id === selectedFilter) || filterChoices[0],
    [filterChoices, selectedFilter]
  )

  const overlayImg = 'img' in selectedFilterChoice ? selectedFilterChoice.img : ''
  const showFallbackOverlay =
    selectedFilter !== 'none' && (!overlayImg || missingFilters[selectedFilter])

  useLayoutEffect(() => {
    if (!showLivePreview) return
    const frame = frameRef.current
    const slot = slotRefs.current[nextShotIndex]
    if (!frame || !slot) return
    const fr = frame.getBoundingClientRect()
    const sr = slot.getBoundingClientRect()
    setLiveOverlay({
      top: sr.top - fr.top,
      height: sr.height,
      width: sr.width,
    })
  }, [showLivePreview, nextShotIndex, shots, selectedFilter, overlayImg])

  function selectFilter(id: string) {
    setMissingFilters((prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
    setSelectedFilter(id)
  }

  const attachVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node
    const stream = streamRef.current
    if (!node || !stream) return
    if (node.srcObject !== stream) {
      node.srcObject = stream
    }
  }, [])

  async function startCamera(nextFacing: 'user' | 'environment') {
    const epoch = ++cameraEpochRef.current
    setErr('')
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false,
      })
      if (epoch !== cameraEpochRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = stream
      const video = videoRef.current
      if (video && video.srcObject !== stream) {
        video.srcObject = stream
      }
    } catch (e) {
      if (!isAbortPlayError(e)) {
        setErr(e instanceof Error ? e.message : '카메라를 열 수 없습니다.')
      }
    }
  }

  function addShot(dataUrl: string) {
    setShots((prev) => {
      const idx = prev.findIndex((x) => !x)
      if (idx < 0) return [dataUrl, null, null, null]

      const next = [...prev]
      next[idx] = dataUrl
      return next
    })
  }

  function capture() {
    const video = videoRef.current
    if (!video) return

    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, width, height)

    const save = () => addShot(canvas.toDataURL('image/png'))

    if (!overlayImg) {
      drawFallbackOverlay(ctx, width, height, selectedFilter)
      save()
      return
    }

    loadImage(overlayImg)
      .then((overlay) => {
        setMissingFilters((prev) => {
          if (!prev[selectedFilter]) return prev
          const next = { ...prev }
          delete next[selectedFilter]
          return next
        })
        ctx.drawImage(overlay, 0, 0, width, height)
        save()
      })
      .catch(() => {
        setMissingFilters((prev) => ({ ...prev, [selectedFilter]: true }))
        drawFallbackOverlay(ctx, width, height, selectedFilter)
        save()
      })
  }

  function cycleEffect() {
    const idx = filterChoices.findIndex((filter) => filter.id === selectedFilter)
    selectFilter(filterChoices[(idx + 1) % filterChoices.length].id)
  }

  function resetCameraStrip() {
    completedStripRef.current = ''
    setShots([null, null, null, null])
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) return
    void Promise.resolve().then(() => startCamera('user'))
    return () => {
      cameraEpochRef.current += 1
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
    }
  }, [])

  useEffect(() => {
    if (!shots.every(Boolean)) return

    const signature = shots.join('|')
    if (signature === completedStripRef.current) return
    completedStripRef.current = signature

    const buildStrip = async () => {
      const images = await Promise.all(shots.map((shot) => loadImage(shot || '')))
      const canvas = document.createElement('canvas')
      canvas.width = 720
      canvas.height = 1280
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.fillStyle = '#745b00'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const padding = 44
      const frameX = padding
      const frameY = padding
      const frameWidth = canvas.width - padding * 2
      const frameHeight = canvas.height - padding * 2
      const radius = 64

      ctx.fillStyle = '#ffeaa8'
      ctx.beginPath()
      ctx.roundRect(frameX, frameY, frameWidth, frameHeight, radius)
      ctx.fill()

      const slotX = frameX + 42
      const slotWidth = frameWidth - 84
      const slotHeight = 235
      const gap = 26
      const slotStartY = frameY + 42

      images.forEach((image, index) => {
        const y = slotStartY + index * (slotHeight + gap)
        ctx.fillStyle = '#f1f5f9'
        ctx.fillRect(slotX, y, slotWidth, slotHeight)
        drawCoverImage(ctx, image, image.naturalWidth, image.naturalHeight, slotX, y, slotWidth, slotHeight)
      })

      ctx.fillStyle = '#745b00'
      ctx.font = 'bold 28px sans-serif'
      ctx.fillText('POKEGUIDE PHOTO', slotX, frameY + frameHeight - 42)
      setRecent((items) => [canvas.toDataURL('image/png'), ...items].slice(0, 8))
    }

    void buildStrip()
  }, [shots])

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen overflow-x-hidden pb-64">
      <header className="bg-yellow-400 dark:bg-yellow-600 text-slate-900 dark:text-white sticky top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-4">
          <Link className="active:translate-y-0.5 transition-transform hover:opacity-80" to="/" aria-label="뒤로">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
          </Link>
          <h1 className="font-plus-jakarta font-black tracking-tight text-lg uppercase text-slate-900 dark:text-white font-headline-md text-headline-md">
            POKEGUIDE
          </h1>
        </div>
        <span
          className="material-symbols-outlined text-2xl text-slate-900 dark:text-white"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          capture
        </span>
      </header>

      <main className="mx-auto w-full max-w-[430px] px-4 py-lg pb-64">
        <div className="text-center mb-lg">
          <h2 className="font-display-lg text-[34px] leading-tight text-primary mb-xs">인생네컷 찍기!</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            좋아하는 파트너 포켓몬과 함께 멋진 사진을 찍어보세요.
          </p>
        </div>

        {err ? (
          <div className="bg-white border-8 border-white rounded-lg p-md neomorph-card text-secondary mb-lg">
            {err}
          </div>
        ) : null}

        <section className="flex flex-col items-center">
          <div
            ref={frameRef}
            className="four-cut-frame relative rounded-xl p-4 w-full max-w-[320px] shadow-2xl flex flex-col gap-3 pokemon-card-shadow"
          >
            {shots.map((shot, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  slotRefs.current[idx] = el
                }}
                className="relative aspect-[4/3] bg-slate-200 overflow-hidden rounded-sm border-2 border-primary/20"
              >
                {shot ? (
                  <img src={shot} alt={`컷 ${idx + 1}`} className="w-full h-full object-cover" />
                ) : idx !== nextShotIndex ? (
                  <div className="w-full h-full bg-white/50 flex items-center justify-center border-2 border-primary/10">
                    <span className="material-symbols-outlined text-primary/30 text-4xl">photo_camera</span>
                  </div>
                ) : null}
              </div>
            ))}

            {showLivePreview ? (
              <div
                className="pointer-events-none absolute left-4 overflow-hidden rounded-sm border-2 border-primary/20 z-10"
                style={{
                  top: liveOverlay.top,
                  width: liveOverlay.width || 'calc(100% - 2rem)',
                  height: liveOverlay.height || undefined,
                }}
              >
                <video
                  ref={attachVideo}
                  className="h-full w-full object-cover"
                  playsInline
                  muted
                  autoPlay
                />
                {showFallbackOverlay ? (
                  <div className="absolute inset-0">
                    <div className="absolute left-0 right-0 top-[8%] h-[8%] bg-slate-950/90" />
                    <div className="absolute left-0 right-0 bottom-[8%] h-[8%] bg-slate-950/90" />
                    <div className="absolute left-[10%] top-[20%] h-12 w-12 rounded-full bg-emerald-300/80" />
                    <div className="absolute right-[12%] bottom-[20%] h-14 w-14 rounded-full bg-orange-300/80" />
                  </div>
                ) : overlayImg ? (
                  <img
                    src={overlayImg}
                    alt=""
                    className="absolute inset-0 h-full w-full object-fill"
                    onError={() => setMissingFilters((prev) => ({ ...prev, [selectedFilter]: true }))}
                  />
                ) : null}
              </div>
            ) : null}

            <div className="flex justify-between items-center px-1 pt-1">
              <span className="text-primary font-black text-xs">POKEGUIDE PHOTO</span>
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                capture
              </span>
            </div>
          </div>

          <div className="fixed bottom-32 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
            <div className="pointer-events-auto flex w-full max-w-[340px] flex-col items-center gap-2 rounded-[2rem] bg-background/95 px-5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur">
              <button
                type="button"
                onClick={resetCameraStrip}
                className="flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-on-surface shadow-sm active:scale-95"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                처음부터 다시 찍기
              </button>
              <div className="flex w-full items-end justify-between gap-3">
              <Link to="/photo/receive" className="flex w-20 flex-col items-center gap-2">
                <span className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-lg">
                  {recent[0] ? (
                    <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" src={recent[0]} />
                  ) : null}
                  <span className="material-symbols-outlined relative text-slate-900 text-[26px]">photo_library</span>
                </span>
                <span className="text-[11px] font-bold leading-none text-on-surface">갤러리</span>
              </Link>

              <button
                type="button"
                onClick={capture}
                className="relative h-24 w-24 shrink-0 rounded-full border-[7px] border-slate-900 bg-white shadow-[0_7px_0_0_rgba(0,0,0,0.22)] active:translate-y-1 active:shadow-[0_3px_0_0_rgba(0,0,0,0.22)] transition-transform overflow-hidden"
                aria-label="사진 찍기"
              >
                <span className="pokeball-inner absolute inset-0" />
                <span className="absolute left-0 right-0 top-1/2 h-[7px] -translate-y-1/2 bg-slate-900" />
                <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[5px] border-slate-900 bg-white">
                  <span className="h-3 w-3 rounded-full border-2 border-slate-300 bg-white" />
                </span>
              </button>

              <button type="button" onClick={cycleEffect} className="flex w-20 flex-col items-center gap-2">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-lg">
                  <span className="material-symbols-outlined text-slate-400 text-[28px]">settings_b_roll</span>
                </span>
                <span className="text-[11px] font-bold leading-none text-on-surface">효과</span>
              </button>
              </div>
            </div>
          </div>

          <div className="mt-md w-full max-w-[360px] overflow-x-auto pb-1 no-scrollbar">
            <div className="flex items-center gap-3">
              {filterChoices.map((filter) => {
                const active = selectedFilter === filter.id
                const isMissing = missingFilters[filter.id]
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => selectFilter(filter.id)}
                    className="flex shrink-0 flex-col items-center gap-1"
                  >
                    <span
                      className={
                        'relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 bg-white transition-transform active:scale-95 ' +
                        (active ? 'border-primary ring-2 ring-primary-container' : 'border-slate-200')
                      }
                    >
                      {'img' in filter && !isMissing ? (
                        <img
                          alt=""
                          className="h-full w-full object-cover"
                          src={filter.img}
                          onLoad={() =>
                            setMissingFilters((prev) => {
                              if (!prev[filter.id]) return prev
                              const next = { ...prev }
                              delete next[filter.id]
                              return next
                            })
                          }
                          onError={() => setMissingFilters((prev) => ({ ...prev, [filter.id]: true }))}
                        />
                      ) : filter.id === 'none' ? (
                        <span className="material-symbols-outlined text-slate-400">{filter.icon}</span>
                      ) : (
                        <span className="text-[9px] font-black text-primary">{filter.label}</span>
                      )}
                    </span>
                    <span className={'text-[10px] font-bold ' + (active ? 'text-primary' : 'text-on-surface-variant')}>
                      {filter.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        <section className="mt-xl">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">최근 찍은 사진</h3>
          <div className="grid grid-cols-2 gap-gutter">
            {recent.slice(0, 2).map((src, i) => (
              <div
                key={i}
                className={
                  'aspect-[9/16] bg-white p-2 rounded-lg pokemon-card-shadow hover:rotate-0 transition-transform duration-300 cursor-pointer overflow-hidden ' +
                  (i === 0 ? 'rotate-2' : '-rotate-3')
                }
              >
                <img alt={`최근 인생네컷 ${i + 1}`} className="h-full w-full rounded-sm object-cover" src={src} />
              </div>
            ))}
            {!recent.length ? (
              <div className="col-span-2 text-on-surface-variant text-sm">
                아직 완성된 인생네컷이 없습니다. 네 컷을 모두 촬영하면 여기에 추가됩니다.
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
