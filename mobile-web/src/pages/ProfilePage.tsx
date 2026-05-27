import { useEffect, useState } from 'react'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { formatXp, getQuizRank } from '../lib/quizXp'
import { clearVisitorSession, getNickname, getPhone, getVisitorToken } from '../lib/storage'
import { fetchVisitorProfile } from '../lib/visitorApi'

export default function ProfilePage() {
  const [token, setToken] = useState(() => getVisitorToken())
  const [nick, setNick] = useState(() => getNickname())
  const [phone, setPhone] = useState(() => getPhone())
  const [quizXp, setQuizXp] = useState(0)
  const [photoCount, setPhotoCount] = useState(0)
  const [challengeCount, setChallengeCount] = useState(0)
  const [eventActionCount, setEventActionCount] = useState(0)
  const [loading, setLoading] = useState(!!getVisitorToken())

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
        setEventActionCount(profile.eventActions?.length ?? 0)
      } catch {
        // keep local cache
      } finally {
        setLoading(false)
      }
    })()
  }, [token])

  const rank = getQuizRank(quizXp)

  function reset() {
    clearVisitorSession()
    setToken('')
    setNick('')
    setPhone('')
    setQuizXp(0)
    setPhotoCount(0)
    setChallengeCount(0)
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
                <span className="text-on-surface-variant">예약/알림</span>
                <span className="font-bold text-on-surface">{eventActionCount}건</span>
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
      </main>

      <BottomNav />
    </div>
  )
}
