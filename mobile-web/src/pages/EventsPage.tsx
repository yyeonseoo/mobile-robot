import { useEffect, useMemo, useRef, useState } from 'react'
import BottomNav from '../components/BottomNav'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import DailyChallengePanel from '../components/DailyChallengePanel'
import { getVisitorToken } from '../lib/storage'
import { listEventActions, setEventAction, type VisitorEventAction } from '../lib/visitorApi'

const FESTIVAL_HERO_IMG = `${import.meta.env.BASE_URL}events/pokemon-festival-2026.png`

const PIKACHU_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCmeFMffqzWnH5Kb3OyRpQ_zrSL--lR_TMrKMXRfKqEhyZUlkV9hutiTwBoHqRe5TarDZTgTcjxqiEUK7-NCiWp9EiAr0B7Mavh-pJrTS-kcvjdV3YeCeCF9pYWWSzLNGd1zW4V9irloj9WUm16tOtTnpD2dZDqo7M4wxEkfNFZBfxqsmLV1fI58IHWZ1g7Y50Iz4Ukc8Di662F2Zt8IxkaTwgAEV2nK54KxQeIbRi2nNPmLGFBUiebxoCdI3SUIUzYnM8J1wNdo4Y'

const EEVEE_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB27VS2sfzZM76QP7qVemWulwtDAcke7VH0y8Du29wiRQu21szAdDUZ8R4ykpiLbpcx2u6hmViLQomxWO0dojL9rrShiFbEwx-TN_nUThiXb7W6A93iJE95O8q8T9Z2vgy1wnbIznf0U4_SAB_pCltHWShgBI0f-TGmHSX24ce-xR661zveb1KsuON-5nQRoBD_4u-F5Lxrss-ZfywLsAKkcyxWYqIXvpwHRauZCkKKd8Jj-4Sd1RCIxGqtfOrvmgpFrkNFeU3GMhw'

const UPCOMING_EVENTS = [
  {
    id: 'capture',
    title: '포획 콘테스트',
    desc: '전 세계 트레이너들과 함께 사파리 존으로! 가장 무거운 개체를 잡아서 우승하세요.',
    badge: '진행 중',
    badgeClass: 'bg-secondary-container text-on-secondary-container',
    image: EEVEE_IMG,
    cta: '예약하기',
    ctaClass: 'bg-tertiary text-white',
    meta: '12k+ 참가',
  },
  {
    id: 'mascot',
    title: '마스코트 미팅',
    desc: '센트럴 광장에서 피카츄를 만나보세요. 사진도 찍고 스티커도 받으세요!',
    badge: '2시간 후 시작',
    badgeClass: 'bg-primary-container text-on-primary-container',
    image: PIKACHU_IMG,
    cta: '알림 받기',
    ctaClass: 'bg-surface-variant text-on-surface-variant',
    meta: '센트럴 광장',
  },
  {
    id: 'battle',
    title: '메가 배틀 토너먼트',
    desc: '자신만의 파티로 배틀 아레나에 도전하세요. 우승자에게 한정 굿즈가 제공됩니다.',
    badge: '오늘 저녁',
    badgeClass: 'bg-tertiary-container text-on-tertiary-container',
    image: PIKACHU_IMG,
    cta: '예약하기',
    ctaClass: 'bg-tertiary text-white',
    meta: '배틀 아레나',
  },
  {
    id: 'ar-photo',
    title: 'AR 포토존',
    desc: '포켓몬 AR 필터와 함께 인생샷을 남겨 보세요. 모바일 앱에서도 확인할 수 있어요.',
    badge: '상시 운영',
    badgeClass: 'bg-surface-container-highest text-on-surface-variant',
    image: EEVEE_IMG,
    cta: '알림 받기',
    ctaClass: 'bg-surface-variant text-on-surface-variant',
    meta: '포토 스튜디오',
  },
] as const

const COLLAPSED_RECOMMEND_COUNT = 1
const COLLAPSED_UPCOMING_COUNT = 1

const RECOMMEND_PRESETS = [
  {
    id: 'eevee',
    title: '이브이 프렌즈 가든 파티',
    tag: 'BEST MATCH',
    reason: '이브이를 좋아하시니까 추천드려요!',
    time: '오늘 오후 3시',
    image: EEVEE_IMG,
    thumbClass: 'bg-primary-fixed',
    borderClass: 'border-primary/20 hover:border-primary/40',
    btnClass: 'bg-primary text-on-primary',
    chipClass: 'bg-secondary-fixed text-on-secondary-fixed',
  },
  {
    id: 'battle',
    title: '메가 배틀 토너먼트',
    tag: null,
    reason: '배틀·도전을 즐기시면 딱 맞아요!',
    time: '오늘 저녁 7시',
    image: PIKACHU_IMG,
    thumbClass: 'bg-tertiary-fixed',
    borderClass: 'border-tertiary/20 hover:border-tertiary/40',
    btnClass: 'bg-tertiary text-white',
    chipClass: 'bg-tertiary-fixed-dim text-on-tertiary-fixed',
  },
  {
    id: 'safari',
    title: '사파리 존 탐험',
    tag: null,
    reason: '야외 체험을 좋아하시면 추천!',
    time: '내일 오전 10시',
    image: EEVEE_IMG,
    thumbClass: 'bg-secondary-fixed',
    borderClass: 'border-secondary/20 hover:border-secondary/40',
    btnClass: 'bg-secondary-container text-white',
    chipClass: 'bg-secondary-fixed text-on-secondary-fixed',
  },
] as const

type PokedexEntry = {
  number: number
  name: string
  category: string
  types: string[]
  description: string
  strongAgainst: string[]
  weakAgainst: string[]
  imageUrl: string
  queryAnswer: string
}

const TYPE_CHIP: Record<string, { bg: string; icon: string }> = {
  전기: { bg: 'bg-yellow-400 text-yellow-950', icon: 'bolt' },
  물: { bg: 'bg-blue-400 text-white', icon: 'water_drop' },
  불꽃: { bg: 'bg-orange-500 text-white', icon: 'local_fire_department' },
  풀: { bg: 'bg-green-500 text-white', icon: 'eco' },
  땅: { bg: 'bg-amber-700 text-white', icon: 'terrain' },
  비행: { bg: 'bg-indigo-300 text-indigo-950', icon: 'air' },
  얼음: { bg: 'bg-cyan-300 text-cyan-950', icon: 'ac_unit' },
  에스퍼: { bg: 'bg-pink-400 text-white', icon: 'psychology' },
  격투: { bg: 'bg-red-600 text-white', icon: 'sports_martial_arts' },
  독: { bg: 'bg-purple-500 text-white', icon: 'science' },
  바위: { bg: 'bg-stone-500 text-white', icon: 'landscape' },
  벌레: { bg: 'bg-lime-500 text-white', icon: 'bug_report' },
  고스트: { bg: 'bg-violet-600 text-white', icon: 'visibility_off' },
  드래곤: { bg: 'bg-indigo-600 text-white', icon: 'cruelty_free' },
  악: { bg: 'bg-zinc-700 text-white', icon: 'dark_mode' },
  강철: { bg: 'bg-slate-400 text-white', icon: 'hardware' },
  페어리: { bg: 'bg-pink-300 text-pink-950', icon: 'auto_awesome' },
  노말: { bg: 'bg-zinc-300 text-zinc-800', icon: 'circle' },
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .trim()
}

function normalizeTypeName(name: string): string {
  return name.replace(/타입$/g, '').trim()
}

function typeLabel(name: string): string {
  return name.includes('타입') ? name : `${name} 타입`
}

function typeChipStyle(name: string): { bg: string; icon: string } {
  return TYPE_CHIP[normalizeTypeName(name)] ?? { bg: 'bg-zinc-300 text-zinc-800', icon: 'category' }
}

async function callPokedex(query: string): Promise<PokedexEntry> {
  const res = await fetch('/api/ai/pokedex', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  let data: PokedexEntry & { error?: string } = {} as PokedexEntry & { error?: string }
  try {
    data = (await res.json()) as PokedexEntry & { error?: string }
  } catch {
    data = {} as PokedexEntry & { error?: string }
  }
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`)
  }
  return {
    ...data,
    description: stripMarkdown(data.description || ''),
    name: stripMarkdown(data.name || ''),
    category: stripMarkdown(data.category || ''),
    queryAnswer: stripMarkdown(data.queryAnswer || ''),
  }
}

async function callAiRecommend(body: object): Promise<string> {
  const res = await fetch('/api/ai/events/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  let data: { text?: string; error?: string } = {}
  try {
    data = (await res.json()) as { text?: string; error?: string }
  } catch {
    data = {}
  }
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`)
  }
  return stripMarkdown(data.text || '')
}

export default function EventsPage() {
  const aiSectionRef = useRef<HTMLElement>(null)
  const [pokedexQuery, setPokedexQuery] = useState('')
  const [pokedexEntry, setPokedexEntry] = useState<PokedexEntry | null>(null)
  const [pokedexError, setPokedexError] = useState('')
  const [pokedexBusy, setPokedexBusy] = useState(false)
  const [showPokedexResult, setShowPokedexResult] = useState(false)

  const [interests, setInterests] = useState('')
  const [companion, setCompanion] = useState('')
  const [recommendNote, setRecommendNote] = useState('')
  const [recommendBusy, setRecommendBusy] = useState(false)
  const [showRecommendPrefs, setShowRecommendPrefs] = useState(false)

  const [toast, setToast] = useState('')
  const [showEventMore, setShowEventMore] = useState(false)
  const [showUpcomingAll, setShowUpcomingAll] = useState(false)
  const [eventActions, setEventActions] = useState<VisitorEventAction[]>([])

  function flash(msg: string) {
    setToast(msg)
    window.setTimeout(() => setToast(''), 2800)
  }

  const actionSet = useMemo(() => {
    const set = new Set<string>()
    for (const a of eventActions) set.add(`${a.eventId}:${a.actionType}`)
    return set
  }, [eventActions])

  function hasAction(eventId: string, actionType: string) {
    return actionSet.has(`${eventId}:${actionType}`)
  }

  async function toggle(eventId: string, actionType: 'reserve' | 'alarm') {
    if (!getVisitorToken()) {
      flash('입장에서 닉네임/전화번호를 입력하면 저장할 수 있어요.')
      return
    }
    const next = !hasAction(eventId, actionType)
    try {
      const updated = await setEventAction(eventId, actionType, next)
      setEventActions(updated)
      flash(
        actionType === 'reserve'
          ? next
            ? '예약이 완료되었습니다.'
            : '예약이 취소되었습니다.'
          : next
            ? '알림을 설정했습니다.'
            : '알림을 해제했습니다.'
      )
    } catch {
      flash('저장에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    }
  }

  useEffect(() => {
    if (!getVisitorToken()) return
    listEventActions()
      .then(setEventActions)
      .catch(() => {})
  }, [])

  async function searchPokedex() {
    const q = pokedexQuery.trim()
    if (!q) {
      flash('포켓몬 이름 또는 번호를 입력해 주세요.')
      return
    }
    setPokedexBusy(true)
    setShowPokedexResult(true)
    setPokedexEntry(null)
    setPokedexError('')
    try {
      const entry = await callPokedex(q)
      setPokedexEntry(entry)
    } catch (e) {
      setPokedexError(e instanceof Error ? e.message : '도감 검색 실패')
    } finally {
      setPokedexBusy(false)
    }
  }

  async function loadRecommendations() {
    setRecommendBusy(true)
    setRecommendNote('Claude가 맞춤 이벤트를 고르는 중이에요…')
    try {
      const text = await callAiRecommend({
        interests: interests.trim(),
        companion: companion.trim(),
      })
      setRecommendNote(text)
      setShowRecommendPrefs(false)
    } catch (e) {
      setRecommendNote(e instanceof Error ? e.message : '추천 실패')
    } finally {
      setRecommendBusy(false)
    }
  }

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen pb-32">
      <AppHeader
        right={
          <button
            type="button"
            className="hover:opacity-80 transition-opacity active:translate-y-0.5"
            aria-label="AI 도감으로 이동"
            onClick={() => aiSectionRef.current?.scrollIntoView({ behavior: 'smooth' })}
          >
            <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">
              auto_awesome
            </span>
          </button>
        }
      />

      <main className={`max-w-4xl mx-auto px-margin ${APP_HEADER_MAIN_PT} space-y-8`}>
        {/* 히어로 — 2026 포켓몬 페스티벌 */}
        <section className="relative rounded-lg overflow-hidden border-4 border-tertiary shadow-xl">
          <img
            src={FESTIVAL_HERO_IMG}
            alt="포켓몬 페스티벌 2026 Pocket Adventure — 피카츄, 이브이, 꼬부기"
            className="w-full aspect-[16/9] object-cover object-center"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-slate-900/92 via-slate-900/45 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 md:p-10">
            <div className="w-full max-w-[min(100%,40rem)] space-y-3 text-white text-left">
              <span className="inline-block bg-secondary px-4 py-1 rounded-full font-label-bold text-sm uppercase shadow-md">
                2026 · 한정 이벤트
              </span>
              <h2 className="font-display-lg text-[clamp(1.75rem,5vw,3rem)] leading-tight drop-shadow-md">
                포켓몬 페스티벌 2026
              </h2>
              <p className="font-headline-md text-primary-container tracking-wide">POCKET ADVENTURE</p>
              <p className="font-body-md text-white/90 leading-relaxed break-keep [word-break:keep-all]">
                오박사님과 함께하는 퀴즈·AI 도감·맞춤 이벤트 추천까지! 지금 페스티벌을 즐겨 보세요.
              </p>
              <button
                type="button"
                className="bg-primary-container text-on-primary-container font-label-bold px-8 py-4 rounded-full border-b-4 border-primary shadow-lg hover:scale-105 active:scale-95 transition-all text-lg uppercase tracking-wider toy-button-shadow-light"
                onClick={() => {
                  document.getElementById('daily-challenge')?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                일일 챌린지 시작
              </button>
            </div>
          </div>
        </section>

        <DailyChallengePanel
          topic={pokedexQuery.trim() || interests.trim()}
          onToast={flash}
        />

        <section className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">event</span>
            추천 &amp; 예정된 이벤트
          </h3>
          <button
            type="button"
            className="font-label-bold text-primary hover:underline underline-offset-2"
            onClick={() => {
              setShowEventMore((v) => {
                const next = !v
                if (next) {
                  window.requestAnimationFrame(() => {
                    document
                      .getElementById('events-recommend')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }
                return next
              })
            }}
          >
            {showEventMore ? '< 접기' : '더보기 +'}
          </button>
        </section>

        {/* AI 포켓몬 도감 */}
        <section ref={aiSectionRef} className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-3xl">psychology</span>
            <h3 className="font-headline-md text-headline-md text-on-surface">AI 포켓몬 도감</h3>
          </div>
          <div className="bg-white rounded-lg border-4 border-tertiary/20 p-6 toy-card space-y-6">
            <div className="relative">
              <input
                className="w-full bg-surface-container rounded-full border-2 border-outline/20 px-6 py-4 pr-14 font-body-md focus:border-tertiary focus:ring-0 outline-none transition-all"
                placeholder="예: 피카츄는 진화하면 뭐가 돼?"
                type="text"
                value={pokedexQuery}
                onChange={(e) => setPokedexQuery(e.target.value)}
                maxLength={120}
                onKeyDown={(e) => e.key === 'Enter' && searchPokedex()}
              />
              <button
                type="button"
                disabled={pokedexBusy}
                className="absolute right-2 top-2 w-10 h-10 bg-tertiary text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-md disabled:opacity-60"
                aria-label="AI 도감 검색"
                onClick={searchPokedex}
              >
                <span className="material-symbols-outlined text-xl">auto_awesome</span>
              </button>
            </div>

            {showPokedexResult && pokedexBusy ? (
              <p className="text-sm text-on-surface-variant text-center py-4">
                테미가 도감을 분석 중이에요…
              </p>
            ) : null}

            {showPokedexResult && pokedexError ? (
              <p className="text-sm text-secondary font-label-bold text-center py-2">{pokedexError}</p>
            ) : null}

            {showPokedexResult && pokedexEntry ? (
              <div className="bg-tertiary/5 rounded-xl p-6 border-2 border-dashed border-tertiary/30 space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-32 h-32 bg-white rounded-2xl border-4 border-yellow-400 p-2 shadow-inner shrink-0 mx-auto md:mx-0 overflow-hidden">
                    <img
                      alt={pokedexEntry.name}
                      className="w-full h-full object-contain"
                      src={pokedexEntry.imageUrl}
                      onError={(e) => {
                        e.currentTarget.src = FESTIVAL_HERO_IMG
                      }}
                    />
                  </div>
                  <div className="space-y-3 min-w-0 flex-1">
                    <h4 className="font-headline-md text-on-surface">
                      {pokedexEntry.number > 0
                        ? `No. ${String(pokedexEntry.number).padStart(3, '0')} ${pokedexEntry.name}`
                        : pokedexEntry.name}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {pokedexEntry.types.map((t) => {
                        const chip = typeChipStyle(t)
                        return (
                          <span
                            key={t}
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-label-bold ${chip.bg}`}
                          >
                            <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                            {typeLabel(t)}
                          </span>
                        )
                      })}
                      {pokedexEntry.category ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-label-bold bg-surface-container-highest text-on-surface-variant">
                          {pokedexEntry.category}
                        </span>
                      ) : null}
                    </div>
                    {pokedexEntry.queryAnswer ? (
                      <div className="rounded-xl bg-tertiary/10 border-2 border-tertiary/25 p-4 space-y-2">
                        <p className="font-label-bold text-sm text-tertiary flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">smart_toy</span>
                          테미의 답변
                        </p>
                        <p className="text-on-surface font-body-md leading-relaxed">
                          {pokedexEntry.queryAnswer}
                        </p>
                      </div>
                    ) : null}
                    <div>
                      <p className="font-label-bold text-xs text-on-surface-variant uppercase tracking-wide mb-2">
                        도감 정보
                      </p>
                      <p className="text-on-surface-variant font-body-md leading-relaxed">
                        {pokedexEntry.description}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white/70 rounded-lg p-4 border border-white">
                    <p className="font-label-bold text-sm text-blue-600 mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">add_circle</span>
                      유리한 상대
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(pokedexEntry.strongAgainst.length
                        ? pokedexEntry.strongAgainst
                        : ['정보 없음']
                      ).map((t) => {
                        const chip = typeChipStyle(t)
                        return (
                          <span
                            key={`s-${t}`}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border-2 border-white/80 ${chip.bg}`}
                          >
                            <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                            {t === '정보 없음' ? t : typeLabel(t)}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="bg-white/70 rounded-lg p-4 border border-white">
                    <p className="font-label-bold text-sm text-secondary mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">remove_circle</span>
                      약점
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(pokedexEntry.weakAgainst.length ? pokedexEntry.weakAgainst : ['정보 없음']).map(
                        (t) => {
                          const chip = typeChipStyle(t)
                          return (
                            <span
                              key={`w-${t}`}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border-2 border-white/80 ${chip.bg}`}
                            >
                              <span className="material-symbols-outlined text-sm">{chip.icon}</span>
                              {t === '정보 없음' ? t : typeLabel(t)}
                            </span>
                          )
                        },
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {!showPokedexResult || (!pokedexBusy && !pokedexEntry && !pokedexError) ? (
              <p className="text-sm text-on-surface-variant text-center py-2">
                예: 피카츄, #025, 이상해씨
              </p>
            ) : null}
          </div>
        </section>

        {/* 당신을 위한 추천 */}
        <section id="events-recommend" className="space-y-6 scroll-mt-28">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">stars</span>
              당신을 위한 추천
            </h3>
            <button
              type="button"
              className="font-label-bold text-tertiary text-sm underline-offset-2 hover:underline"
              onClick={() => setShowRecommendPrefs((v) => !v)}
            >
              {showRecommendPrefs ? '설정 닫기' : '관심사 설정'}
            </button>
          </div>

          {showRecommendPrefs ? (
            <div className="bg-white rounded-lg border-4 border-primary/20 p-5 toy-card space-y-3">
              <input
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                maxLength={500}
                placeholder="관심사 (예: 이브이, 그림 그리기)"
                className="w-full bg-surface-container rounded-full border-2 border-outline/20 px-5 py-3 text-sm outline-none focus:border-primary"
              />
              <input
                value={companion}
                onChange={(e) => setCompanion(e.target.value)}
                maxLength={120}
                placeholder="동행 (예: 초등학생 자녀)"
                className="w-full bg-surface-container rounded-full border-2 border-outline/20 px-5 py-3 text-sm outline-none focus:border-primary"
              />
              <button
                type="button"
                disabled={recommendBusy}
                className="w-full bg-secondary-container text-white font-label-bold py-3 rounded-full neomorph-button disabled:opacity-60"
                onClick={loadRecommendations}
              >
                {recommendBusy ? 'Claude 추천 중…' : 'Claude로 맞춤 추천 받기'}
              </button>
            </div>
          ) : null}

          {recommendNote ? (
            <div className="bg-primary/5 rounded-xl p-4 border-2 border-dashed border-primary/30 text-sm text-on-surface-variant whitespace-pre-wrap leading-relaxed">
              {recommendNote}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {(showEventMore
              ? RECOMMEND_PRESETS
              : RECOMMEND_PRESETS.slice(0, COLLAPSED_RECOMMEND_COUNT)
            ).map((card) => (
              <div
                key={card.id}
                className={
                  'bg-white rounded-lg border-4 p-5 toy-card flex gap-4 transition-colors cursor-pointer relative overflow-hidden group ' +
                  card.borderClass
                }
                role="button"
                tabIndex={0}
                onClick={() => toggle(card.id, 'reserve')}
                onKeyDown={(e) => e.key === 'Enter' && toggle(card.id, 'reserve')}
              >
                {card.tag ? (
                  <div className="absolute top-3 left-3 bg-primary text-white text-[10px] font-label-bold px-3 py-1 rounded-full z-10 shadow-md">
                    {card.tag}
                  </div>
                ) : null}
                <div
                  className={'w-20 h-20 rounded-lg shrink-0 overflow-hidden ' + card.thumbClass}
                >
                  <img
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    src={card.image}
                  />
                </div>
                <div className="grow space-y-2 min-w-0">
                  <h4 className="font-label-bold text-on-surface leading-tight">{card.title}</h4>
                  <span
                    className={
                      'inline-block text-[10px] font-label-bold px-2 py-0.5 rounded-full ' +
                      card.chipClass
                    }
                  >
                    {card.reason}
                  </span>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <span className="text-xs text-on-surface-variant font-medium">{card.time}</span>
                    <button
                      type="button"
                      className={
                        'text-xs font-label-bold px-4 py-1.5 rounded-full neomorph-button shrink-0 ' +
                        card.btnClass
                      }
                      onClick={(e) => {
                        e.stopPropagation()
                        toggle(card.id, 'reserve')
                      }}
                    >
                      {hasAction(card.id, 'reserve') ? '예약됨' : '예약하기'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 예정된 이벤트 */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">event</span>
              예정된 이벤트
            </h3>
            <button
              type="button"
              className="font-label-bold text-primary hover:underline"
              onClick={() => setShowUpcomingAll(true)}
            >
              전체보기
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
            {(showEventMore
              ? UPCOMING_EVENTS
              : UPCOMING_EVENTS.slice(0, COLLAPSED_UPCOMING_COUNT)
            ).map((ev) => (
              <article
                key={ev.id}
                className="bg-white rounded-lg border-8 border-white p-0 overflow-hidden toy-card hover:scale-[1.02] transition-transform"
              >
                <div className="h-48 relative overflow-hidden">
                  <img alt="" className="w-full h-full object-cover" src={ev.image} />
                  <div className="absolute top-4 left-4">
                    <span
                      className={
                        'font-label-bold px-3 py-1 rounded-full text-xs border-2 border-white shadow-md ' +
                        ev.badgeClass
                      }
                    >
                      {ev.badge}
                    </span>
                  </div>
                </div>
                <div className="p-6 bg-surface-container-low">
                  <h4 className="font-headline-md text-headline-md text-on-surface mb-2">{ev.title}</h4>
                  <p className="text-on-surface-variant font-body-md mb-4">{ev.desc}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined text-sm">location_on</span>
                      <span className="text-xs font-label-bold">{ev.meta}</span>
                    </div>
                    <button
                      type="button"
                      className={'font-label-bold px-6 py-2 rounded-full neomorph-button ' + ev.ctaClass}
                      onClick={() => toggle(ev.id, ev.cta === '알림 받기' ? 'alarm' : 'reserve')}
                    >
                      {ev.cta === '알림 받기'
                        ? hasAction(ev.id, 'alarm')
                          ? '알림 설정됨'
                          : '알림 받기'
                        : hasAction(ev.id, 'reserve')
                          ? '예약됨'
                          : '예약하기'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      {showUpcomingAll ? (
        <div
          className="fixed inset-0 z-[70] bg-slate-950/50 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="전체 이벤트 목록"
          onClick={() => setShowUpcomingAll(false)}
        >
          <div
            className="mx-auto w-full max-w-4xl bg-white rounded-2xl border-8 border-white toy-card overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-6 py-5 bg-surface-container-low border-b-4 border-white">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-secondary">event</span>
                <h3 className="font-headline-md text-headline-md text-on-surface truncate">
                  전체 이벤트
                </h3>
                <span className="text-xs font-label-bold text-on-surface-variant">
                  {UPCOMING_EVENTS.length}개
                </span>
              </div>
              <button
                type="button"
                className="shrink-0 w-10 h-10 rounded-full bg-white border-2 border-surface-variant flex items-center justify-center hover:opacity-80 active:scale-95 transition"
                aria-label="닫기"
                onClick={() => setShowUpcomingAll(false)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto p-6 bg-background">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                {UPCOMING_EVENTS.map((ev) => (
                  <article
                    key={`all-${ev.id}`}
                    className="bg-white rounded-lg border-8 border-white p-0 overflow-hidden toy-card hover:scale-[1.02] transition-transform"
                  >
                    <div className="h-48 relative overflow-hidden">
                      <img alt="" className="w-full h-full object-cover" src={ev.image} />
                      <div className="absolute top-4 left-4">
                        <span
                          className={
                            'font-label-bold px-3 py-1 rounded-full text-xs border-2 border-white shadow-md ' +
                            ev.badgeClass
                          }
                        >
                          {ev.badge}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 bg-surface-container-low">
                      <h4 className="font-headline-md text-headline-md text-on-surface mb-2">
                        {ev.title}
                      </h4>
                      <p className="text-on-surface-variant font-body-md mb-4">{ev.desc}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-on-surface-variant">
                          <span className="material-symbols-outlined text-sm">location_on</span>
                          <span className="text-xs font-label-bold">{ev.meta}</span>
                        </div>
                        <button
                          type="button"
                          className={'font-label-bold px-6 py-2 rounded-full neomorph-button ' + ev.ctaClass}
                          onClick={() => toggle(ev.id, ev.cta === '알림 받기' ? 'alarm' : 'reserve')}
                        >
                          {ev.cta === '알림 받기'
                            ? hasAction(ev.id, 'alarm')
                              ? '알림 설정됨'
                              : '알림 받기'
                            : hasAction(ev.id, 'reserve')
                              ? '예약됨'
                              : '예약하기'}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div
          className="fixed left-1/2 bottom-28 z-[60] -translate-x-1/2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg"
          role="status"
        >
          {toast}
        </div>
      ) : null}

      <BottomNav />
    </div>
  )
}
