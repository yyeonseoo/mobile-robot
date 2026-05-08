import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function ScanPage() {
  const nav = useNavigate()
  const [value, setValue] = useState('')
  const [msg, setMsg] = useState('')

  function go() {
    const v = value.trim()
    if (!v) {
      setMsg('코드를 입력하세요.')
      return
    }
    nav(`/rally?claim=${encodeURIComponent(v)}`)
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
          <h2 className="font-headline-md text-headline-md text-on-surface">QR / 코드 입력</h2>
          <p className="text-on-surface-variant text-sm">
            지금은 입력 방식으로 연결해뒀고, 추후 카메라 기반 스캔을 붙일 수 있어요.
          </p>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="예: RALLY-1"
            className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
          />
          <button
            type="button"
            className="w-full bg-primary-container text-on-primary-fixed rounded-lg py-3 font-bold toy-button-shadow-light"
            onClick={go}
          >
            랠리로 보내기
          </button>
          {msg ? <p className="text-on-surface-variant text-sm">{msg}</p> : null}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

