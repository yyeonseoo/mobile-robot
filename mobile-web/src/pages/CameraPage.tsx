import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export default function CameraPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [err, setErr] = useState('')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [flashOn, setFlashOn] = useState(false)

  const [selectedFilter, setSelectedFilter] = useState<string>('eevee')
  const [shots, setShots] = useState<(string | null)[]>([null, null, null, null])
  const [recent, setRecent] = useState<string[]>([])
  const nextShotIndex = useMemo(() => {
    const idx = shots.findIndex((x) => !x)
    return idx < 0 ? 0 : idx
  }, [shots])

  const filterChoices = useMemo(
    () => [
      { id: 'none', label: '없음', icon: 'block' as const },
      {
        id: 'eevee',
        label: '이브이',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAdV-L-qZeum1PlLhAZFxyps0rbSXhYz50UgwmveEKCyH3ZhyZ1lrpK8EcNV7oT8xd8u_3R_ZzCe8TN6e7y3rjBiYbLPTR5Ewu9O93huNeANAWxy8MP7mGgnK-hx4veNTnSzC0sD6q-T2w4gGZh1TtBDxCIptT9S3rc573x60zq1MzoSjagd0lteqWYBpF7ATYXpaJWfUXI5d9iTo3wfp0Fs9kxDUxq_4X0k0W-ULET6jfdlTfnDPfrm5aqF6A58kUEQ06a3HsRB4g',
      },
      {
        id: 'snorlax',
        label: '잠만보',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB07bSU8HlcqO-aNg0F-PhSzTr5v8QuJTV_w_t-YLaeDNrjlF6CZim4pNd8WCqgHGl1bUcqtPa8WOoVFOtljEAIU-odZp2bxz0BzcUWDRf7k2FchBC204g_T_g-x_lontuuKm5R_BtH6FZhP5Gjr5y3WM-tQRICluX3mx21GYLWRe5ZZExakZnz2AF-gQ-44Z2jnJ13Z3Ujwvyfbu-hv9C9ifo52s8Rbim7UAfHB1rTTl32sDVISXnQwbpOyiVtjaBBEsLAJf4DzdQ',
      },
      {
        id: 'jigglypuff',
        label: '푸린',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOp-K2PEOWdwlwsa480zJsVH8ycpu0qV357xQQRerUpKZHQs4O2FcPBVrKSJSCJ91X1ksLXWTwW7FEzoQQDVyB34kJzVAhFfHEFOlT9dak9vrL-G7lcYBVCMOCzqJeMoUddaTlIzaKiviJJaIKLlC6jmkayVNYeMVs0_MPbtnAUtNiXS1vSAGGcIfZJMkDmAZc857W4JfNFHwaAeOAnFHxyF9AL_bGL6qsrjJvL9DOAhubkA1pgz5KiuFGEdpz2M5T5ZzK9JsyUNY',
      },
      {
        id: 'pikachu',
        label: '피카츄',
        img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA3g9NQsaDoIxs7VwEcQCIJDgGw8z1r2u1dGr_V1_KFJwB-5jfIlzjmjpjrSy8JIGkoMX1Jon-QCd8dL1N3x-gML3wGH4KicN6jQfPm4itr3aAOVmUbxe8T0TDLC25slJ64ZXlJ6_7TYjY8YJbl07LJ8bLZthxhmo7ZuzPW5AkkvFHl8XPrm8ENUNHljTZHVEWm7A72X5D8wrSW0blvXS7wLq6sVAAgBwT-aLe4PkYN_m_Y3lKqjLgZUIETOc-tuN_-wlyZw13ydu8',
      },
    ],
    []
  )

  const overlayImg = useMemo(() => {
    const c = filterChoices.find((x) => x.id === selectedFilter) as any
    return c && c.img ? (c.img as string) : ''
  }, [filterChoices, selectedFilter])

  async function startCamera(nextFacing: 'user' | 'environment') {
    setErr('')
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: nextFacing } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : '카메라를 열 수 없습니다.')
    }
  }

  async function flipCamera() {
    const next = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(next)
    await startCamera(next)
  }

  async function toggleFlash() {
    const stream = streamRef.current
    const track = stream?.getVideoTracks()?.[0]
    if (!track) return
    const caps = track.getCapabilities?.() as any
    if (!caps?.torch) {
      setFlashOn((v) => !v)
      return
    }
    const next = !flashOn
    try {
      await track.applyConstraints({ advanced: [{ torch: next }] } as any)
      setFlashOn(next)
    } catch {
      setFlashOn((v) => !v)
    }
  }

  function capture() {
    const v = videoRef.current
    if (!v) return
    const w = v.videoWidth || 1280
    const h = v.videoHeight || 720
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(v, 0, 0, w, h)

    if (overlayImg) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const size = Math.round(Math.min(w, h) * 0.22)
        ctx.save()
        ctx.globalAlpha = 0.92
        ctx.drawImage(img, w - size - 24, 24, size, size)
        ctx.restore()
        const dataUrl = canvas.toDataURL('image/png')
        setShots((prev) => {
          const idx = prev.findIndex((x) => !x)
          if (idx < 0) return prev
          const next = [...prev]
          next[idx] = dataUrl
          return next
        })
        setRecent((r) => [dataUrl, ...r].slice(0, 8))
      }
      img.src = overlayImg
      return
    }

    const dataUrl = canvas.toDataURL('image/png')
    setShots((prev) => {
      const idx = prev.findIndex((x) => !x)
      const at = idx < 0 ? 0 : idx
      const next = [...prev]
      next[at] = dataUrl
      return next
    })
    setRecent((r) => [dataUrl, ...r].slice(0, 8))
  }

  function resetShots() {
    setShots([null, null, null, null])
  }

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('이 브라우저는 카메라를 지원하지 않습니다.')
      return
    }
    startCamera(facingMode).catch(() => {})
    return () => {
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen overflow-x-hidden pb-[140px]">
      <header className="bg-yellow-400 dark:bg-yellow-600 text-slate-900 dark:text-white sticky top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-4">
          <Link className="active:translate-y-0.5 transition-transform hover:opacity-80" to="/" aria-label="홈으로">
            <span className="material-symbols-outlined text-slate-900 dark:text-white">arrow_back</span>
          </Link>
          <h1 className="font-plus-jakarta font-black tracking-tight text-lg uppercase text-slate-900 dark:text-white font-headline-md text-headline-md">
            POKÉGUIDE
          </h1>
        </div>
        <div className="text-2xl font-black italic text-slate-900 dark:text-white tracking-tighter">
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            capture
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-margin py-lg pb-[140px]">
        <div className="text-center mb-lg">
          <h2 className="font-display-lg text-display-lg text-primary mb-xs">인생네컷 찍기!</h2>
          <p className="text-on-surface-variant font-body-lg">
            좋아하는 파트너 포켓몬과 함께 멋진 포즈를 취해보세요!
          </p>
        </div>

        {err ? (
          <div className="bg-white border-8 border-white rounded-lg p-md neomorph-card text-secondary mb-lg">
            {err}
          </div>
        ) : null}

        <div className="relative flex flex-col md:flex-row gap-gutter items-start justify-center">
          <div className="four-cut-frame rounded-xl p-4 w-full max-w-[320px] mx-auto shadow-2xl flex flex-col gap-3 pokemon-card-shadow">
            {shots.map((s, idx) => {
              const showLive = !s && idx === nextShotIndex
              return (
                <div
                  key={idx}
                  className="relative aspect-[4/3] bg-slate-200 overflow-hidden rounded-sm border-2 border-primary/20"
                >
                  {s ? (
                    <img src={s} alt={`컷 ${idx + 1}`} className="w-full h-full object-cover" />
                  ) : showLive ? (
                    <>
                      <video
                        ref={videoRef}
                        className="w-full h-full object-cover"
                        playsInline
                        muted
                        autoPlay
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-32 h-16 bg-primary-container/20 border-2 border-dashed border-primary rounded-full animate-pulse flex items-center justify-center">
                          <span className="text-[10px] text-primary font-label-bold">AR 필터 적용 중</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full bg-white/50 flex items-center justify-center border-2 border-primary/10">
                      <span className="material-symbols-outlined text-primary/30 text-4xl">photo_camera</span>
                    </div>
                  )}

                  {showLive ? (
                    <div className="absolute right-2 top-2 w-12 h-12 rounded-full bg-white/85 flex items-center justify-center border-2 border-primary/20">
                      {overlayImg ? (
                        <img src={overlayImg} alt="filter" className="w-9 h-9 object-contain" />
                      ) : (
                        <span className="material-symbols-outlined text-primary/40">block</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })}

            <div className="flex justify-between items-center px-1 pt-1">
              <span className="text-primary font-black text-xs">POKÉGUIDE PHOTO</span>
              <span
                className="material-symbols-outlined text-primary text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                capture
              </span>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md">
            <div className="flex justify-center gap-sm mb-md">
              <button
                type="button"
                onClick={flipCamera}
                className="bg-surface-container-high text-on-surface p-sm rounded-full hover:bg-surface-variant transition-colors shadow-sm"
                aria-label="카메라 전환"
              >
                <span className="material-symbols-outlined">flip_camera_ios</span>
              </button>
              <button
                type="button"
                onClick={toggleFlash}
                className="bg-surface-container-high text-on-surface p-sm rounded-full hover:bg-surface-variant transition-colors shadow-sm"
                aria-label="플래시"
              >
                <span className="material-symbols-outlined">{flashOn ? 'flash_on' : 'flash_off'}</span>
              </button>
            </div>

            <div className="bg-surface-container-low p-md rounded-lg mb-lg">
              <div className="flex items-center gap-gutter overflow-x-auto pb-sm no-scrollbar">
                {filterChoices.map((f: any) => {
                  const active = selectedFilter === f.id
                  return (
                    <div key={f.id} className="flex flex-col items-center gap-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedFilter(f.id)}
                        className={
                          'w-16 h-16 rounded-full bg-white border-4 flex items-center justify-center hover:scale-105 transition-transform active:scale-95 ' +
                          (active
                            ? 'border-primary-container ring-4 ring-offset-2 ring-primary'
                            : 'border-slate-200')
                        }
                      >
                        {f.img ? (
                          <img alt={f.label} className="w-full h-full object-contain p-2" src={f.img} />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400">{f.icon}</span>
                        )}
                      </button>
                      <span className={'font-label-bold text-[10px] uppercase ' + (active ? 'text-primary' : 'text-on-surface-variant')}>
                        {f.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center justify-between gap-gutter">
              <Link to="/photo/receive" className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg border-4 border-slate-100 flex items-center justify-center group-active:scale-90 transition-transform overflow-hidden relative">
                  {recent[0] ? (
                    <img alt="Gallery Preview" className="w-full h-full object-cover opacity-60" src={recent[0]} />
                  ) : (
                    <div className="w-full h-full bg-slate-100" />
                  )}
                  <span className="material-symbols-outlined absolute text-on-surface text-3xl">photo_library</span>
                </div>
                <span className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant">갤러리</span>
              </Link>

              <button
                type="button"
                onClick={capture}
                className="relative z-10 w-28 h-28 rounded-full border-8 border-slate-900 shadow-[0_12px_0_0_rgba(0,0,0,0.2)] overflow-hidden group active:translate-y-2 active:shadow-none transition-all duration-100"
                aria-label="촬영"
              >
                <div className="pokeball-inner absolute inset-0 w-full h-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-3 bg-slate-900" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-4 border-slate-900 bg-white flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                  </div>
                </div>
              </button>

              <button type="button" onClick={resetShots} className="flex flex-col items-center gap-2 group">
                <div className="w-16 h-16 bg-white rounded-xl shadow-lg border-4 border-slate-100 flex items-center justify-center group-active:scale-90 transition-transform">
                  <span className="material-symbols-outlined text-slate-400 text-3xl">settings_b_roll</span>
                </div>
                <span className="font-label-bold text-xs uppercase tracking-wider text-on-surface-variant">효과</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-xl">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-md">최근 찍은 사진</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
            {recent.slice(0, 2).map((src, i) => (
              <div
                key={i}
                className={
                  'aspect-[1/2] bg-white p-2 rounded-lg pokemon-card-shadow hover:rotate-0 transition-transform duration-300 cursor-pointer overflow-hidden flex flex-col gap-1 ' +
                  (i === 0 ? 'rotate-2' : '-rotate-3')
                }
              >
                <div className="flex-1 bg-slate-100 rounded-sm">
                  <img alt={`Recent Snap ${i + 1}`} className="w-full h-full object-cover" src={src} />
                </div>
                <div className="h-1/4 bg-slate-200/50" />
                <div className="h-1/4 bg-slate-200/50" />
                <div className="h-1/4 bg-slate-200/50" />
              </div>
            ))}
            {recent.slice(2, 4).map((src, i) => (
              <div
                key={`sq-${i}`}
                className={
                  'aspect-square bg-white p-2 rounded-lg pokemon-card-shadow hover:rotate-0 transition-transform duration-300 cursor-pointer hidden md:block ' +
                  (i === 0 ? 'rotate-1' : '-rotate-1')
                }
              >
                <img alt={`Recent Snap ${i + 3}`} className="w-full h-full object-cover rounded-sm" src={src} />
              </div>
            ))}
            {!recent.length ? (
              <div className="col-span-2 md:col-span-4 text-on-surface-variant text-sm">
                아직 촬영한 사진이 없습니다. 가운데 포켓볼 버튼을 눌러 촬영해 보세요.
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-50">
        <div className="bg-white dark:bg-slate-900 rounded-full border-4 border-slate-900 dark:border-white shadow-[0_8px_0_0_rgba(0,0,0,1)] flex justify-around items-center px-6 py-2">
          <Link
            to="/map"
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:scale-110 transition-transform duration-200"
          >
            <span className="material-symbols-outlined text-[28px]">map</span>
            <span className="text-[10px] font-label-bold uppercase tracking-tighter">지도</span>
          </Link>
          <button
            type="button"
            className="flex flex-col items-center justify-center bg-primary text-on-primary rounded-full w-16 h-16 shadow-lg ring-4 ring-slate-900 hover:scale-110 transition-transform duration-200 -translate-y-4"
            aria-current="page"
          >
            <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              capture
            </span>
            <span className="text-[10px] font-label-bold uppercase tracking-tighter">촬영</span>
          </button>
          <Link
            to="/scan"
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:scale-110 transition-transform duration-200"
          >
            <span className="material-symbols-outlined text-[28px]">qr_code_scanner</span>
            <span className="text-[10px] font-label-bold uppercase tracking-tighter">스캔</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-0.5 text-slate-400 dark:text-slate-500 hover:scale-110 transition-transform duration-200"
          >
            <span className="material-symbols-outlined text-[28px]">person</span>
            <span className="text-[10px] font-label-bold uppercase tracking-tighter">내정보</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

