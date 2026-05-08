import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { jsonFetch } from '../lib/api'

type Exhibition = {
  id: string
  name: string
  zone: string
  locationText: string
  description: string
  estimatedMinutes: number
  directionHint: string
  latitude: number
  longitude: number
}

function distMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const toR = Math.PI / 180
  const dLat = (lat2 - lat1) * toR
  const dLon = (lon2 - lon1) * toR
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

export default function MapPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const idParam = useMemo(() => (params.get('id') || '').trim(), [params])

  const [all, setAll] = useState<Exhibition[]>([])
  const [hint, setHint] = useState('목록을 불러오는 중…')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Exhibition | null>(null)
  const [distanceLine, setDistanceLine] = useState('')

  const filtered = useMemo(() => {
    const f = (query || '').toLowerCase()
    if (!f) return all
    return all.filter((ex) => (ex.name + ex.zone + ex.locationText).toLowerCase().includes(f))
  }, [all, query])

  async function openDetail(id: string) {
    setSelected(null)
    setDistanceLine('불러오는 중…')
    try {
      const ex = await jsonFetch<Exhibition>(`/api/exhibitions/${encodeURIComponent(id)}`)
      setSelected(ex)
      nav(`/map?id=${encodeURIComponent(id)}`, { replace: true })

      if (!navigator.geolocation) {
        setDistanceLine('거리: 위치 권한을 주면 표시합니다.')
        return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const d = distMeters(pos.coords.latitude, pos.coords.longitude, ex.latitude, ex.longitude)
          setDistanceLine(`현재 위치 기준 약 ${d}m`)
        },
        () => setDistanceLine('거리를 표시하려면 위치 권한을 허용해 주세요.'),
        { enableHighAccuracy: true, timeout: 12000 }
      )
    } catch {
      setDistanceLine('불러오지 못했습니다.')
    }
  }

  function closeDetail() {
    setSelected(null)
    setDistanceLine('')
    nav('/map', { replace: true })
  }

  useEffect(() => {
    ;(async () => {
      try {
        const rows = await jsonFetch<Exhibition[]>('/api/exhibitions')
        setAll(rows || [])
        setHint(`총 ${rows.length}개 전시`)
        if (idParam) openDetail(idParam).catch(() => {})
      } catch {
        setHint('API를 불러오지 못했습니다.')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen pb-32 selection:bg-primary-container">
      <header className="sticky top-0 z-40 bg-yellow-400 dark:bg-yellow-600 shadow-xl border-b-4 border-yellow-600/30 px-6 py-4 flex justify-between items-center w-full">
        <div className="flex items-center gap-3 active:translate-y-0.5 transition-transform">
          <Link to="/" className="material-symbols-outlined text-slate-900" aria-label="홈으로">
            arrow_back
          </Link>
          <h1 className="tracking-tight text-slate-900 font-headline-md">POKÉGUIDE</h1>
        </div>
        <span
          className="material-symbols-outlined text-2xl font-black italic text-slate-900 tracking-tighter"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          capture
        </span>
      </header>

      <main className="pt-24 pb-32 px-margin max-w-4xl mx-auto min-h-screen space-y-gutter">
        <div className="mb-lg text-center">
          <h2 className="font-display-lg text-display-lg text-primary mb-xs">나의 길 찾기</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            모험을 떠나보세요, 트레이너님! 새로운 세상이 기다리고 있습니다.
          </p>
        </div>

        {!selected ? (
          <>
            <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
              <label className="font-label-bold text-on-surface" htmlFor="q">
                전시 이름 검색
              </label>
              <input
                id="q"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="이름 또는 구역"
                autoComplete="off"
                className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
              />
            </section>

            <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card">
              <p className="text-on-surface-variant text-sm mb-sm">{hint}</p>
              <div className="divide-y divide-surface-variant">
                {filtered.map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    className="w-full text-left py-3"
                    onClick={() => openDetail(ex.id)}
                  >
                    <span className="font-bold text-on-surface">{ex.name}</span>
                    <span className="text-on-surface-variant"> · {ex.zone}</span>
                  </button>
                ))}
                {!filtered.length ? (
                  <div className="py-3 text-on-surface-variant text-sm">검색 결과 없음</div>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
            <button
              type="button"
              className="bg-surface-container-low text-on-surface rounded-lg py-2 px-3 font-bold toy-button-shadow-light"
              onClick={closeDetail}
            >
              목록으로
            </button>
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{selected.name}</h3>
              <p className="text-on-surface-variant">
                {selected.zone} · {selected.locationText}
              </p>
            </div>
            <p className="text-on-surface leading-relaxed">{selected.description}</p>
            <p className="text-on-surface-variant">
              예상 이동 약 {selected.estimatedMinutes}분 · {selected.directionHint}
            </p>
            {distanceLine ? <p className="font-bold text-on-surface">{distanceLine}</p> : null}
            <button
              type="button"
              className="w-full bg-primary-container text-on-primary-fixed rounded-lg py-3 font-bold toy-button-shadow-light"
              onClick={() => alert('데모: 실제 앱에서는 경로 polyline·내비 연동을 붙입니다.')}
            >
              길안내 시작 (데모)
            </button>
          </section>
        )}

        <div className="relative w-full aspect-[4/5] md:aspect-video rounded-lg overflow-hidden neomorphic-card mb-lg group">
          <img
            className="w-full h-full object-cover"
            alt="월드 지도"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqyhtsF65TW178mVBxhxy-F1bEJk3ohcbd0noTe1GFxdWB5cGo9RU4MGufpCnpQMhxKo_QwMYkPeqpl_OAu8k8hlzQYARtPXz3-zwor05iUtniLVHTHPAhpDxJM4QA6dsnqAHbL61aUyfA4_9L-LFcr_nRAS5UamvevH2mXivI4rTAjfPZaS5qAoNS6qWE-CBPlx2N1lCP15gVvTk8X2D4LRcZw0DN9b0efisYB78Emq3cXVkB1KVFn2zvWiZ8-dpNmaTjIwI-OyI"
          />

          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            preserveAspectRatio="xMidYMid slice"
            viewBox="0 0 800 600"
          >
            <path
              className="path-dash"
              d="M 100,500 Q 250,450 400,300 T 700,100"
              fill="none"
              stroke="#ffcb05"
              strokeLinecap="round"
              strokeWidth="8"
            />
            <circle className="animate-pulse" cx="200" cy="460" fill="white" r="4" />
            <circle className="animate-pulse" cx="350" cy="350" fill="white" r="3" />
            <circle className="animate-pulse" cx="500" cy="220" fill="white" r="5" />
            <circle className="animate-pulse" cx="650" cy="130" fill="white" r="4" />
          </svg>

          <div className="absolute bottom-[15%] left-[10%] -translate-x-1/2 -translate-y-1/2">
            <div className="relative">
              <div className="w-16 h-16 bg-white rounded-full p-1 shadow-lg border-4 border-tertiary flex items-center justify-center animate-bounce">
                <span
                  className="material-symbols-outlined text-tertiary text-4xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  person_pin_circle
                </span>
              </div>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-black/20 rounded-full blur-sm" />
            </div>
          </div>

          <div className="absolute top-[15%] right-[10%] -translate-x-1/2 -translate-y-1/2">
            <div className="w-12 h-12 bg-secondary-container rounded-full flex items-center justify-center shadow-lg border-4 border-white animate-pulse">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                location_on
              </span>
            </div>
          </div>

          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary active:scale-95 transition-transform">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary active:scale-95 transition-transform">
              <span className="material-symbols-outlined">remove</span>
            </button>
            <button className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary active:scale-95 transition-transform">
              <span className="material-symbols-outlined">my_location</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
          <button className="col-span-2 bg-primary-container rounded-lg p-6 flex items-center justify-between toy-button-shadow border-2 border-primary/20 hover:opacity-90 transition-all">
            <div className="text-left">
              <p className="font-label-bold text-on-primary-fixed-variant uppercase text-xs tracking-wider mb-1">
                길을 잃으셨나요? 파트너를 부르세요!
              </p>
              <h3 className="font-headline-md text-headline-md text-on-primary-fixed">
                피카츄 부르기
              </h3>
            </div>
            <div className="w-16 h-16 bg-white/40 rounded-full flex items-center justify-center">
              <span
                className="material-symbols-outlined text-4xl text-on-primary-fixed"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                bolt
              </span>
            </div>
          </button>

          <div className="bg-tertiary-container rounded-lg p-6 flex flex-col justify-center neomorphic-card">
            <p className="font-label-bold text-on-tertiary-container text-xs uppercase mb-1">거리</p>
            <p className="font-headline-md text-headline-md text-tertiary">1.2 KM</p>
          </div>
          <div className="bg-surface-container-highest rounded-lg p-6 flex flex-col justify-center neomorphic-card">
            <p className="font-label-bold text-on-surface-variant text-xs uppercase mb-1">시간</p>
            <p className="font-headline-md text-headline-md text-on-surface">15분</p>
          </div>
        </div>

        <div className="mt-lg grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <div className="bg-white rounded-lg p-sm flex items-center gap-sm neomorphic-card">
            <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 border-surface-variant">
              <img
                className="w-full h-full object-cover"
                alt="숨겨진 길"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUZ23_bb8ZZY0q7pcJoXcb3ldeHV6TVrSR1eeynHovC1itBVph8tZdpbd3iACYoXTvLxLtuaj8aFw6w-HHPrfBDAsCA8LtJ-t87bbzYV5eMZExQYFKXgkFd9TIU3kkfnF1CtpJmKv_U3yRR7zSGoLXtEHCY3SVyxpGB8jvdW2QVvYBS_QDBU-wz4I3pR03JJUWl_1Vz8fNt2j15x7NHYvBoQoja6QXTfHfxIa87kbQZgWBt7K50y1m-6x1nI71dZmDoddQA7c4IqQ"
              />
            </div>
            <div>
              <h4 className="font-headline-md text-body-lg text-primary">숨겨진 길</h4>
              <p className="text-on-surface-variant text-sm">상록숲에서 지름길이 발견되었습니다!</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-sm flex items-center gap-sm neomorphic-card">
            <div className="w-20 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 border-surface-variant">
              <img
                className="w-full h-full object-cover"
                alt="아이템 가방"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBDtb2yx2URgKbIyK3fphFAT2QtCdr10HiSzJCdU4b2_pbCPwh2bP_-09tqPX0n-Fo1SOZNjse28aHVycY_DbZMowUKldcEg0We_kxSEkxjG7ZP4Xvbrk-9f9Wvs_n_ziZ1xt20pD7vEZLAC2HpI4WD8yDNA45YwfrawDhgACNqTIOXEnhlu8QPldWHqYhut3BnwayfxmWtY1if5cd-TqZr3IeN6HEpfic2mrFg0EP9z7h6kgV_WH9YyPgArV3hhXP6eVVETVcMBLo"
              />
            </div>
            <div>
              <h4 className="font-headline-md text-body-lg text-primary">아이템 가방</h4>
              <p className="text-on-surface-variant text-sm">상처약 챙기는 거 잊지 마세요!</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}

