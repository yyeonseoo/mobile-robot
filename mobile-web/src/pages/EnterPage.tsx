import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pathFromNextKey } from '../lib/sessionRoutes'
import {
  createVisitorSession,
  isValidKoreanMobile,
  normalizePhoneInput,
  syncQuizXpTotal,
} from '../lib/visitorApi'
import { loadQuizXp, saveQuizXp } from '../lib/quizXp'
import {
  getNickname,
  getPhone,
  getVisitorToken,
  setNickname,
  setPhone,
  setVisitorToken,
} from '../lib/storage'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'

export default function EnterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [nickname, setNickInput] = useState(() => getNickname())
  const [phone, setPhoneInput] = useState(() => getPhone())
  const [statusLine, setStatusLine] = useState(() =>
    getVisitorToken() ? '세션: 연결됨' : '세션: 없음'
  )
  const [busy, setBusy] = useState(false)
  const next = useMemo(() => params.get('next') || '', [params])

  useEffect(() => {
    if (!getVisitorToken()) return
    const dest = pathFromNextKey(next) || '/'
    navigate(dest, { replace: true })
  }, [next, navigate])

  async function createSession() {
    const nick = nickname.trim()
    const phoneDigits = normalizePhoneInput(phone)
    if (!nick) {
      alert('닉네임을 입력해 주세요.')
      return
    }
    if (!isValidKoreanMobile(phoneDigits)) {
      alert('휴대폰 번호를 올바르게 입력해 주세요. (예: 01012345678)')
      return
    }

    setBusy(true)
    try {
      const data = await createVisitorSession(nick, phoneDigits)
      setVisitorToken(data.visitorToken)
      setNickname(data.nickname ? String(data.nickname) : nick)
      setPhone(data.phoneNumber ? String(data.phoneNumber) : phoneDigits)

      const localXp = loadQuizXp()
      if (localXp > 0) {
        const merged = await syncQuizXpTotal(localXp)
        saveQuizXp(merged)
      } else if (data.quizXp != null) {
        saveQuizXp(data.quizXp)
      }

      setStatusLine(
        `세션: 연결됨${data.nickname ? ` (${data.nickname})` : ''}${data.phoneNumber ? ` · ${data.phoneNumber}` : ''}`
      )

      const dest = pathFromNextKey(next) || '/'
      navigate(dest, { replace: true })
    } catch (e) {
      alert(e instanceof Error ? e.message : '세션 발급 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <AppHeader />

      <main className={`${APP_HEADER_MAIN_PT} px-gutter max-w-2xl mx-auto space-y-gutter`}>
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">입장</h2>
          <p className="text-on-surface-variant text-sm">
            닉네임과 휴대폰 번호로 참가합니다. 사진·퀴즈 경험치·스탬프가 이 계정에 저장됩니다.
          </p>
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <label className="font-label-bold text-on-surface" htmlFor="nickname">
            닉네임
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickInput(e.target.value)}
            maxLength={64}
            placeholder="예: 지우"
            autoComplete="nickname"
            className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
          />

          <label className="font-label-bold text-on-surface" htmlFor="phone">
            휴대폰 번호
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhoneInput(e.target.value)}
            maxLength={13}
            placeholder="01012345678"
            autoComplete="tel"
            className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
          />

          <button
            type="button"
            className="w-full bg-primary-container text-on-primary-fixed rounded-lg py-3 font-bold toy-button-shadow-light disabled:opacity-60"
            onClick={createSession}
            disabled={busy}
          >
            {busy ? '세션 만드는 중…' : '시작하기 · 세션 만들기'}
          </button>
          <p className="text-on-surface-variant text-sm">{statusLine}</p>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
