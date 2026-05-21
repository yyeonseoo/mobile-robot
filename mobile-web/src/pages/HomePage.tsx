import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { authHeaders, jsonFetch } from '../lib/api'
import { getVisitorToken } from '../lib/storage'

type RallyMeta = { totalSpots: number; eventTitle: string }
type RallyStatus = { collectedCount: number; totalSpots: number; completed: boolean }
type MyStamp = { spotName: string; spotCode: string; collectedAt?: string }
type StampSpot = { code: string; name: string }

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false)
  const [collectedCount, setCollectedCount] = useState(0)
  const [totalSpots, setTotalSpots] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [stamps, setStamps] = useState<MyStamp[]>([])
  const [allSpots, setAllSpots] = useState<StampSpot[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const meta = await jsonFetch<RallyMeta>('/api/rally/meta')
        setTotalSpots(meta.totalSpots ?? 0)

        const token = getVisitorToken()
        setHasSession(!!token)
        if (!token) {
          setCollectedCount(0)
          setStamps([])
          setCompleted(false)
          return
        }

        const st = await jsonFetch<RallyStatus>('/api/rally/status', { headers: authHeaders() })
        setCollectedCount(st.collectedCount)
        setTotalSpots(st.totalSpots)
        setCompleted(st.completed)

        const items = await jsonFetch<MyStamp[]>('/api/my-stamps', { headers: authHeaders() })
        setStamps(items || [])

        if (st.collectedCount < st.totalSpots) {
          const spots = await jsonFetch<StampSpot[]>('/api/spots')
          setAllSpots(spots || [])
        }
      } catch {
        // UI defaults
      }
    })()
  }, [])

  const pct = useMemo(
    () => (totalSpots > 0 ? Math.round((collectedCount * 100) / totalSpots) : 0),
    [collectedCount, totalSpots]
  )

  const badgeText = `${collectedCount}/${totalSpots} 발견함`

  const featured = useMemo(() => {
    if (!hasSession) {
      return {
        title: '스탬프 랠리 시작하기',
        subtitle: '입장 후 스탬프를 모아 보세요',
        checked: false,
      }
    }
    if (completed) {
      const last = stamps[stamps.length - 1]
      return {
        title: last?.spotName ?? '랠리 완료!',
        subtitle: '모든 스탬프를 모았어요',
        checked: true,
      }
    }
    if (stamps.length > 0) {
      const last = stamps[stamps.length - 1]
      return {
        title: last.spotName,
        subtitle: `스탬프: ${last.spotCode}`,
        checked: true,
      }
    }
    const collectedCodes = new Set(stamps.map((s) => s.spotCode))
    const next = allSpots.find((s) => !collectedCodes.has(s.code))
    if (next) {
      return {
        title: next.name,
        subtitle: `다음 목표 · ${next.code}`,
        checked: false,
      }
    }
    return {
      title: '스탬프를 모아 보세요',
      subtitle: '스탬프 랠리에서 QR 스캔하기',
      checked: false,
    }
  }, [hasSession, completed, stamps, allSpots])

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <header className="bg-yellow-400 dark:bg-yellow-600 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl">
        <h1 className="text-2xl font-extrabold italic text-slate-900 dark:text-white tracking-tighter font-['Plus_Jakarta_Sans']">
          POKÉGUIDE
        </h1>
        <div className="flex items-center gap-4">
          <span
            className="material-symbols-outlined text-3xl text-slate-900 dark:text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            capture
          </span>
        </div>
      </header>

      <main className="pt-24 px-gutter max-w-2xl mx-auto space-y-gutter">
        <section className="relative bg-primary-container rounded-lg p-base overflow-hidden neomorph-card border-8 border-white">
          <div className="relative z-10 p-md flex flex-col items-center text-center gap-sm">
            <div className="bg-white/90 backdrop-blur px-sm py-xs rounded-full inline-flex items-center gap-xs">
              <span className="w-3 h-3 bg-secondary rounded-full animate-pulse" />
              <span className="font-label-bold text-on-primary-fixed-variant uppercase text-xs">
                진행 중인 이벤트
              </span>
            </div>
            <h2 className="font-display-lg text-display-lg text-on-primary-fixed leading-tight">
              피카츄가 기다리고 있어요!
            </h2>
            <div className="w-full aspect-video rounded-xl overflow-hidden mt-sm">
              <img
                alt="Pikachu waving"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9p93EzStol5b-vTteM059dYV_2FACrpNd1hZ2aS_tf4Kq-Rn6g-mtUvwbzj7on2FJsdjSlsfimQ56MRCj6cDbDBDcUXW1q0xuXh2-LAq_o7guLi9-sMAmzkqzMc_AxQ8gg4bmahZfN3NHtlJOlx5P2SEGLosd6lwdNsFevMNQiIXRWLuVFu11pwmF1BRndY23QE6WwaAxtw3oDKqTpJq4VPrlrKyIz_ol0Wv_rIG3ubkKt3kdVx5o3RzN3qwc5G9rVs68EHsYshc"
              />
            </div>
            <p className="font-body-lg text-on-primary-fixed-variant mt-sm">
              중앙 광장으로 가서 특별한 인사를 나눠보세요!
            </p>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl" />
        </section>

        <section className="grid grid-cols-2 gap-gutter">
          <Link
            to="/rally"
            className="flex flex-col items-center justify-center bg-white border-8 border-white rounded-lg p-lg neomorph-card hover:scale-105 active:scale-95 transition-all text-center group"
          >
            <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-md group-hover:rotate-12 transition-transform shadow-[0_6px_0_0_#930004]">
              <span
                className="material-symbols-outlined text-5xl text-white"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                capture
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface">스탬프 랠리</span>
          </Link>

          <Link
            to="/map"
            className="flex flex-col items-center justify-center bg-white border-8 border-white rounded-lg p-lg neomorph-card hover:scale-105 active:scale-95 transition-all text-center group"
          >
            <div className="w-20 h-20 bg-tertiary rounded-full flex items-center justify-center mb-md group-hover:rotate-12 transition-transform shadow-[0_6px_0_0_#2335b5]">
              <span className="material-symbols-outlined text-5xl text-white">map</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface">포켓맵</span>
          </Link>

          <Link
            to="/camera"
            className="flex flex-col items-center justify-center bg-white border-8 border-white rounded-lg p-lg neomorph-card hover:scale-105 active:scale-95 transition-all text-center group"
          >
            <div className="w-20 h-20 bg-primary-fixed-dim rounded-full flex items-center justify-center mb-md group-hover:rotate-12 transition-transform shadow-[0_6px_0_0_#745b00]">
              <span className="material-symbols-outlined text-5xl text-on-primary-fixed">
                photo_camera
              </span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface">포켓캠</span>
          </Link>

          <button className="flex flex-col items-center justify-center bg-white border-8 border-white rounded-lg p-lg neomorph-card hover:scale-105 active:scale-95 transition-all text-center group">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-md group-hover:rotate-12 transition-transform shadow-[0_6px_0_0_#930004]">
              <span className="material-symbols-outlined text-5xl text-white">celebration</span>
            </div>
            <span className="font-headline-md text-headline-md text-on-surface">이벤트</span>
          </button>
        </section>

        <Link
          to={hasSession ? '/rally' : '/enter?next=rally'}
          className="block bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-md hover:opacity-95 transition-opacity"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-headline-md text-headline-md text-on-surface">오늘의 수집</h3>
            <span className="bg-tertiary-container text-on-tertiary-container px-sm py-xs rounded-full font-label-bold text-xs uppercase">
              {badgeText}
            </span>
          </div>

          <div className="flex justify-between items-center bg-surface-container-low p-sm rounded-xl">
            <div className="flex items-center gap-sm min-w-0">
              <div className="w-12 h-12 shrink-0 bg-white rounded-full flex items-center justify-center border-2 border-surface-variant">
                <span
                  className="material-symbols-outlined text-tertiary"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  stars
                </span>
              </div>
              <div className="min-w-0">
                <p className="font-label-bold text-on-surface truncate">{featured.title}</p>
                <p className="text-xs text-on-surface-variant truncate">{featured.subtitle}</p>
              </div>
            </div>
            {featured.checked ? (
              <div className="w-8 h-8 shrink-0 rounded-full border-4 border-tertiary flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary text-lg">check</span>
              </div>
            ) : (
              <div className="w-8 h-8 shrink-0 rounded-full border-4 border-surface-variant flex items-center justify-center opacity-40">
                <span className="material-symbols-outlined text-on-surface-variant text-lg">radio_button_unchecked</span>
              </div>
            )}
          </div>

          <div className="h-4 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-tertiary to-tertiary-container rounded-full transition-all duration-300"
              style={{ width: `${Math.max(pct, totalSpots > 0 && collectedCount > 0 ? 8 : 0)}%` }}
            />
          </div>
        </Link>
      </main>

      <BottomNav />
    </div>
  )
}
