import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

const HEADER_CLASS =
  'bg-yellow-400 dark:bg-yellow-600 text-slate-900 dark:text-white sticky top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl flex justify-between items-center w-full px-6 py-4 overflow-hidden'

const LOGO_CLASS =
  "text-2xl leading-none font-extrabold italic text-slate-900 dark:text-white tracking-tighter font-['Plus_Jakarta_Sans']"

export const APP_HEADER_MAIN_PT = 'pt-24'

type AppHeaderProps = {
  /** 홈: 로고만. 그 외: 뒤로가기 + 로고 */
  variant?: 'home' | 'sub'
  /** sub일 때 뒤로가기 경로 (기본 `/`) */
  backTo?: string
  onBack?: () => void
  right?: ReactNode
}

function CaptureIcon() {
  return (
    <span
      className="material-symbols-outlined text-3xl text-slate-900 dark:text-white"
      style={{ fontVariationSettings: "'FILL' 1" }}
      aria-hidden
    >
      capture
    </span>
  )
}

export default function AppHeader({
  variant = 'sub',
  backTo = '/',
  onBack,
  right,
}: AppHeaderProps) {
  const nav = useNavigate()

  if (variant === 'home') {
    return (
      <header className={HEADER_CLASS}>
        <h1 className={LOGO_CLASS}>POKÉGUIDE</h1>
      </header>
    )
  }

  function handleBack() {
    if (onBack) {
      onBack()
      return
    }
    nav(backTo)
  }

  return (
    <header className={HEADER_CLASS}>
      <div className="flex items-center gap-4 min-w-0">
        <button
          type="button"
          onClick={handleBack}
          className="shrink-0 active:translate-y-0.5 transition-transform hover:opacity-80"
          aria-label="뒤로"
        >
          <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">
            arrow_back
          </span>
        </button>
        <h1 className={`${LOGO_CLASS} truncate`}>POKÉGUIDE</h1>
      </div>
      <div className="shrink-0 flex items-center">{right ?? <CaptureIcon />}</div>
    </header>
  )
}
