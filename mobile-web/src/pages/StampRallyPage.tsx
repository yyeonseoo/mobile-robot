import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { authHeaders, jsonFetch } from '../lib/api'

type RallyMeta = { eventTitle: string }
type RallyStatus = { collectedCount: number; totalSpots: number; completed: boolean }
type MyStamp = { spotName: string; spotCode: string }
type ClaimResponse = {
  spotName?: string
  newlyCollected?: boolean
  alreadyHad?: boolean
  rallyComplete?: boolean
}

const DEMO_BADGES = [
  {
    label: '포레스트',
    labelClass: 'text-green-700',
    ringClass: 'bg-green-100 border-green-400',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcbXrCvjcHpIToajNXU7jUyAgr0BV7tO3RvcEClAnv99hrM-BCOvGREMCeWca-lb3qIP22q8w_LrVmsOD0lhQFu3XCZy551pQRP7gK_W_UnO8_WO5GP7gisUtzPr8WSw59guRVfl_kQSaak0Mx3gkBw2uRzjzxjCEZm6dIoKweXxbdmJZvS6U7uE1wp8nuwZ3mzFKKzy2ejOk7Zv_MuS0gn2_wGdc-RvKCFd7PZKztq9zSyCmGzr16XgSb6cAHvehmrzJj2I6gFhc',
    alt: 'Forest badge',
  },
  {
    label: '플레임',
    labelClass: 'text-orange-700',
    ringClass: 'bg-orange-100 border-orange-400',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAl0jlt-CK9juzziboRZYpQO4DVn4KGew4WkWipeB3EzplRml9OS5iztzaDXl3kIUMfPItnEtlDNU8AhKaovfwxL9RB74U4l-eKD92Pcy5INAHqp5UirawZpOZh5HNZELNC-d9q0uOD8tgls7zE-kjnflO6udQ17P0fozo8QUwNJeGk4JmeC8ipPz7VN-1rp56dEZf1P1kmO004dSVLTbB8aFluJVLXpi5lFDpE7-AcSWSQolpnh560OAftxrPWQUj4c7GIKOsYc-Q',
    alt: 'Flame badge',
  },
  {
    label: '오션',
    labelClass: 'text-tertiary',
    ringClass: 'bg-blue-100 border-blue-400',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBH29JrM9u-dMHwaISZvZCOTz0HayAaxiUB_Q3Ou-YwlsynwfcAL_Q_nCO_xNI48wvoBgsbtmI_Lg1p1yed3mKI93MyC7xTvSr6R1dhYV14YtPf9ikxv6th6nFHgUENtjaBG4NlfzUc9R0KOL5NFvXRX0kgy7N4t6Ick41W0AR-Be-EgZoFvtl-4vKwFe2ly4h9JyW0SrxDTq1EhDVK7SS05Nikh_q8QHAYxoVuXbXvgIaNwUGL-QUWBsg-tATZ9yaDiptHGOvPBgM',
    alt: 'Ocean badge',
  },
] as const

const MAP_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDMQCYuZ_t12QmFSHtARE1xYerOrgtRt4DzPMNTX-xsQsxS8fiL2vQw5Rc-z-IDMXGSmDD7QUmsWSWH3mxRw9tKqb0jfZtAOTkyKO8NK8PopKe6Ojmb_hmL5hW7JXQW9qHOUdQybV2OiTCtwVYNj3TIghr8qeSb3uqH3Q-yNW1ye-Wpwzj_md0_oh4A-_7MpBnhx8z6AQPG9kyaSw9e6vJovWn7f-BsWH0aHxywJFp7ov06MF0x-Wn5vztSnI-cNYUYnmWN-HPYKgM'

export default function StampRallyPage() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const claimParam = useMemo(() => (params.get('claim') || '').trim(), [params])

  const [collectedCount, setCollectedCount] = useState(0)
  const [totalSpots, setTotalSpots] = useState(0)
  const [pct, setPct] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [stamps, setStamps] = useState<MyStamp[]>([])

  const statusText = `${collectedCount} / ${totalSpots} 획득함`

  async function refreshMetaAndStatus() {
    await jsonFetch<RallyMeta>('/api/rally/meta')
    const st = await jsonFetch<RallyStatus>('/api/rally/status', { headers: authHeaders() })
    const p = st.totalSpots > 0 ? Math.round((st.collectedCount * 100) / st.totalSpots) : 0
    setCollectedCount(st.collectedCount)
    setTotalSpots(st.totalSpots)
    setPct(p)
    setCompleted(!!st.completed)
  }

  async function refreshList() {
    const items = await jsonFetch<MyStamp[]>('/api/my-stamps', { headers: authHeaders() })
    setStamps(items || [])
  }

  async function tryClaim(code: string) {
    try {
      const data = await jsonFetch<ClaimResponse>('/api/stamps/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ qrValue: code }),
      })
      await refreshMetaAndStatus()
      await refreshList()
      if (data.rallyComplete) setCompleted(true)
    } catch {
      // claim via URL is best-effort
    }
  }

  useEffect(() => {
    ;(async () => {
      try {
        await refreshMetaAndStatus()
        await refreshList()

        if (claimParam) {
          await tryClaim(claimParam)
          nav('/rally', { replace: true })
          return
        }

        const pending = sessionStorage.getItem('pendingClaim')
        if (pending) {
          sessionStorage.removeItem('pendingClaim')
          await tryClaim(pending)
        }
      } catch {
        // keep UI
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen pb-32">
      <AppHeader />

      <main className={`px-margin ${APP_HEADER_MAIN_PT} space-y-gutter max-w-2xl mx-auto`}>
        <section className="text-center space-y-xs pt-base">
          <h2 className="font-display-lg text-display-lg text-primary">모두 모아보자!</h2>
          <p className="font-body-md text-body-md text-on-surface-variant px-md">
            포켓몬 센터를 방문하고 디지털 스탬프 북을 채워보세요!
          </p>
        </section>

        <section className="flex flex-col items-center py-sm">
          <button
            type="button"
            onClick={() => nav('/scan')}
            className="relative flex flex-col items-center group active:scale-95 transition-transform duration-100"
          >
            <div
              className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden shadow-[0_8px_0_0_rgba(0,0,0,1)] flex flex-col relative"
              style={{ background: 'linear-gradient(to bottom, #e90d11 50%, #ffffff 50%)' }}
            >
              <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-900 -translate-y-1/2" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-4 border-slate-900 bg-white flex items-center justify-center z-10">
                <div className="w-3 h-3 rounded-full border-2 border-slate-900" />
              </div>
            </div>
            <span className="mt-base block font-headline-md text-headline-md text-secondary uppercase tracking-widest text-center">
              QR 스캔하기
            </span>
          </button>
        </section>

        <section className="bg-surface-container-lowest rounded-lg p-md neumorphic-shadow border-4 border-surface-variant relative overflow-hidden">
          <div className="flex justify-between items-center mb-base">
            <span className="font-label-bold text-label-bold text-tertiary">스탬프 진행도</span>
            <span className="font-label-bold text-label-bold text-on-surface">{statusText}</span>
          </div>
          <div className="relative h-12 bg-surface-container rounded-full p-1 border-2 border-outline-variant pokeball-path">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-outline-variant -translate-y-1/2" />
            <div
              className="absolute top-0 left-0 h-full bg-secondary-container rounded-full flex items-center justify-end pr-1 shadow-inner transition-all duration-300"
              style={{ width: `${Math.max(pct, completed ? 100 : 8)}%` }}
            >
              <div className="w-8 h-8 bg-white rounded-full border-2 border-on-secondary-fixed flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-secondary text-sm"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  capture
                </span>
              </div>
            </div>
          </div>
        </section>

        {completed ? (
          <section className="bg-primary-container rounded-lg p-md border-4 border-white neumorphic-shadow text-center">
            <div className="font-headline-md text-headline-md text-on-primary-fixed">랠리 완료!</div>
            <p className="text-on-primary-fixed-variant mt-xs text-sm">
              안내 데스크에서 기념 스티커를 받아가세요.
            </p>
          </section>
        ) : null}

        <section className="rounded-lg overflow-hidden neumorphic-shadow border-4 border-white aspect-square relative bg-tertiary-container">
          <img className="w-full h-full object-cover" alt="스탬프 랠리 지도" src={MAP_IMG} />
          <div className="absolute top-1/4 left-1/3 group">
            <div className="bg-white p-1 rounded-full border-4 border-secondary-container shadow-lg scale-110 active:scale-90 transition-transform">
              <span
                className="material-symbols-outlined text-secondary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                home_pin
              </span>
            </div>
          </div>
          <div className="absolute bottom-1/3 right-1/4">
            <div className="bg-white p-1 rounded-full border-4 border-tertiary shadow-lg opacity-80">
              <span className="material-symbols-outlined text-tertiary">location_on</span>
            </div>
          </div>
        </section>

        <section className="space-y-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface">나의 뱃지</h3>
          <div className="grid grid-cols-3 gap-gutter">
            {DEMO_BADGES.map((badge, i) => {
              const stamp = stamps[i]
              const unlocked = !!stamp
              return (
                <div
                  key={badge.label}
                  className={
                    'stamp-card rounded-lg p-sm flex flex-col items-center gap-base ' +
                    (unlocked ? 'bg-white' : 'bg-surface-container-low grayscale opacity-50')
                  }
                >
                  <div
                    className={
                      'w-16 h-16 rounded-full flex items-center justify-center border-2 border-dashed ' +
                      (unlocked ? badge.ringClass : 'bg-surface-variant border-outline')
                    }
                  >
                    {unlocked ? (
                      <img className="w-12 h-12 object-contain" alt={badge.alt} src={badge.img} />
                    ) : (
                      <span className="material-symbols-outlined text-4xl text-outline">lock</span>
                    )}
                  </div>
                  <span
                    className={
                      'font-label-bold text-label-bold text-center ' +
                      (unlocked ? badge.labelClass : 'text-outline')
                    }
                  >
                    {unlocked ? stamp.spotName || badge.label : '잠김'}
                  </span>
                </div>
              )
            })}
            <div className="stamp-card rounded-lg bg-surface-container-low p-sm flex flex-col items-center gap-base grayscale opacity-50">
              <div className="w-16 h-16 rounded-full bg-surface-variant flex items-center justify-center border-2 border-dashed border-outline">
                <span className="material-symbols-outlined text-4xl text-outline">lock</span>
              </div>
              <span className="font-label-bold text-label-bold text-outline">잠김</span>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
