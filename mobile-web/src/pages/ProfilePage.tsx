import { useEffect, useState } from 'react'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { formatXp, getQuizRank } from '../lib/quizXp'
import { clearVisitorSession, getNickname, getPhone, getVisitorToken } from '../lib/storage'
import {
  fetchVisitorProfile,
  listVisitorPhotos,
  type VisitorEventAction,
  type VisitorPhotoItem,
} from '../lib/visitorApi'

const EVENT_TITLES: Record<string, string> = {
  eevee: '이브이 프렌즈 가든 파티',
  battle: '메가 배틀 토너먼트',
  capture: '포획 콘테스트',
  mascot: '마스코트 미팅',
}

const EVENT_STATUS: Record<string, 'running' | 'scheduled'> = {
  capture: 'running',
  eevee: 'scheduled',
  mascot: 'scheduled',
  battle: 'scheduled',
}

export default function ProfilePage() {
  const [token, setToken] = useState(() => getVisitorToken())
  const [nick, setNick] = useState(() => getNickname())
  const [phone, setPhone] = useState(() => getPhone())
  const [quizXp, setQuizXp] = useState(0)
  const [photoCount, setPhotoCount] = useState(0)
  const [challengeCount, setChallengeCount] = useState(0)
  const [loading, setLoading] = useState(!!getVisitorToken())
  const [photos, setPhotos] = useState<VisitorPhotoItem[]>([])
  const [eventActions, setEventActions] = useState<VisitorEventAction[]>([])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const profile = await fetchVisitorProfile()
        if (!profile) return
        setNick(profile.nickname || '')
        setPhone(profile.phoneNumber || '')
        setQuizXp(profile.quizXp)
        setPhotoCount(profile.photoCount)
        setChallengeCount(profile.recentChallenges?.length ?? 0)
        setEventActions(profile.eventActions || [])
        const items = await listVisitorPhotos()
        setPhotos(items)
      } catch {
        // keep local cache
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const rank = getQuizRank(quizXp)
  const registeredEvents = Array.from(
    new Map(
      eventActions
        .filter((item) => item.actionType === 'join' || item.actionType === 'pending')
        .map((item) => [item.eventId, item])
    ).values()
  )

  function reset() {
    clearVisitorSession()
    setToken('')
    setNick('')
    setPhone('')
    setQuizXp(0)
    setPhotoCount(0)
    setChallengeCount(0)
    setEventActions([])
    alert('세션을 초기화했습니다.')
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <AppHeader />

      <main className={`${APP_HEADER_MAIN_PT} px-gutter max-w-2xl mx-auto space-y-gutter`}>
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">내 프로필</h2>
          <p className="text-on-surface-variant text-sm">
            서버에 저장된 참가 정보입니다. 토큰이 있어야 랠리·전시·퀴즈가 동작합니다.
          </p>
          {loading ? (
            <p className="text-on-surface-variant text-sm">불러오는 중…</p>
          ) : (
            <div className="space-y-xs">
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">닉네임</span>
                <span className="font-bold text-on-surface">{nick || '없음'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">휴대폰</span>
                <span className="font-bold text-on-surface">{phone || '없음'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">퀴즈 XP</span>
                <span className="font-bold text-on-surface">
                  {formatXp(quizXp)} · {rank.title}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">저장된 사진</span>
                <span className="font-bold text-on-surface">{photoCount}장</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">챌린지 기록</span>
                <span className="font-bold text-on-surface">{challengeCount}건 (최근)</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-on-surface-variant">토큰</span>
                <span className="font-bold text-on-surface">{token ? '연결됨' : '없음'}</span>
              </div>
            </div>
          )}
          <button
            type="button"
            className="w-full bg-surface-container-low text-on-surface rounded-lg py-3 font-bold toy-button-shadow-light"
            onClick={reset}
          >
            세션 초기화
          </button>
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface">등록한 이벤트</h3>
          <p className="text-on-surface-variant text-sm">
            진행 중인 이벤트는 참가중, 시작 전 이벤트는 참가 대기로 표시됩니다.
          </p>
          {registeredEvents.length ? (
            <div className="space-y-sm">
              {registeredEvents.map((event) => {
                const isRunning = EVENT_STATUS[event.eventId] === 'running'
                return (
                  <div
                    key={`${event.eventId}-${event.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-sm border-2 border-surface-variant"
                  >
                    <div className="min-w-0">
                      <p className="font-label-bold text-on-surface truncate">
                        {EVENT_TITLES[event.eventId] || event.eventId}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={
                        'shrink-0 rounded-full px-3 py-1 text-xs font-label-bold ' +
                        (isRunning
                          ? 'bg-secondary-container text-white'
                          : 'bg-[#ffdd2d] text-slate-950 border-2 border-[#f3bd00]')
                      }
                    >
                      {isRunning ? '참가중' : '참가 대기'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">등록한 이벤트가 없습니다.</p>
          )}
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h3 className="font-headline-md text-headline-md text-on-surface">내 갤러리</h3>
          <p className="text-on-surface-variant text-sm">
            테미에서 찍은 인생네컷이 서버에 저장되면 여기에 표시됩니다. 사진을 눌러 저장할 수
            있습니다.
          </p>
          {photos.length ? (
            <div className="grid grid-cols-2 gap-gutter">
              {photos.map((photo) => {
                const abs = photo.imageUrl.startsWith('http')
                  ? photo.imageUrl
                  : `${location.origin}${photo.imageUrl}`
                return (
                  <a
                    key={photo.id}
                    href={abs}
                    download={`pokeguide-${photo.id}.png`}
                    className="block rounded-lg overflow-hidden border-2 border-surface-variant"
                  >
                    <img src={abs} alt="" className="w-full aspect-[3/4] object-cover" />
                  </a>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">저장된 사진이 없습니다.</p>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
