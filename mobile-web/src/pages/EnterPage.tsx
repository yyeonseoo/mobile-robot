import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { jsonFetch } from '../lib/api'
import { getNickname, getVisitorToken, setNickname, setVisitorToken } from '../lib/storage'
import BottomNav from '../components/BottomNav'

type CreateSessionResponse = {
  visitorToken: string
  nickname?: string | null
}

export default function EnterPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [nickname, setNickInput] = useState(() => getNickname())
  const [statusLine, setStatusLine] = useState(() => (getVisitorToken() ? '세션: 연결됨' : '세션: 없음'))
  const [busy, setBusy] = useState(false)
  const next = useMemo(() => params.get('next') || '', [params])

  async function createSession() {
    const nick = (nickname || '').trim()
    setBusy(true)
    try {
      const data = await jsonFetch<CreateSessionResponse>('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nick ? { nickname: nick } : {}),
      })
      setVisitorToken(data.visitorToken)
      setNickname(data.nickname ? String(data.nickname) : '')
      setStatusLine(`세션: 연결됨${data.nickname ? ` (${data.nickname})` : ''}`)

      if (next === 'rally') navigate('/rally', { replace: true })
      else navigate('/', { replace: true })
    } catch (e) {
      alert(e instanceof Error ? e.message : '세션 발급 실패')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <header className="bg-yellow-400 dark:bg-yellow-600 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">menu</span>
          <h1 className="text-2xl font-extrabold italic text-slate-900 dark:text-white tracking-tighter font-['Plus_Jakarta_Sans']">
            POKÉGUIDE
          </h1>
        </div>
        <span
          className="material-symbols-outlined text-3xl text-slate-900 dark:text-white"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          capture
        </span>
      </header>

      <main className="pt-24 px-gutter max-w-2xl mx-auto space-y-gutter">
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">입장</h2>
          <p className="text-on-surface-variant text-sm">
            닉네임은 선택 사항입니다. 공용 기기이므로 민감한 정보는 입력하지 마세요.
          </p>
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <label className="font-label-bold text-on-surface" htmlFor="nickname">
            닉네임 (선택)
          </label>
          <input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickInput(e.target.value)}
            maxLength={64}
            placeholder="예: 팀 A"
            autoComplete="nickname"
            className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
          />
          <button
            type="button"
            className="w-full bg-primary-container text-on-primary-fixed rounded-lg py-3 font-bold toy-button-shadow-light"
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

