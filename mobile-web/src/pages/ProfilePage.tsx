import BottomNav from '../components/BottomNav'
import { clearNickname, clearVisitorToken, getNickname, getVisitorToken } from '../lib/storage'
import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const [token, setToken] = useState(() => getVisitorToken())
  const [nick, setNick] = useState(() => getNickname())

  function reset() {
    clearVisitorToken()
    clearNickname()
    setToken('')
    setNick('')
    alert('세션을 초기화했습니다.')
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
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
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            capture
          </span>
        </div>
      </header>

      <main className="pt-24 px-gutter max-w-2xl mx-auto space-y-gutter">
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">세션 정보</h2>
          <p className="text-on-surface-variant text-sm">
            토큰이 있어야 랠리/전시 API가 동작합니다.
          </p>
          <div className="space-y-xs">
            <div className="flex justify-between gap-3">
              <span className="text-on-surface-variant">닉네임</span>
              <span className="font-bold text-on-surface">{nick || '없음'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-on-surface-variant">토큰</span>
              <span className="font-bold text-on-surface">{token ? '연결됨' : '없음'}</span>
            </div>
          </div>
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

