import { useLocation, useNavigate } from 'react-router-dom'
import { APP_TABS, ENTER_NEXT_KEYS, type AppTabKey } from '../lib/navTabs'

const TABS = APP_TABS
type TabKey = AppTabKey

function activeTabFromPath(pathname: string, search: string): TabKey | null {
  if (pathname === '/enter') {
    const next = new URLSearchParams(search).get('next') || ''
    if (ENTER_NEXT_KEYS.includes(next as TabKey)) return next as TabKey
    return null
  }
  if (pathname === '/' || pathname === '') return 'home'
  if (pathname.startsWith('/events')) return 'events'
  if (pathname.startsWith('/rally')) return 'rally'
  if (pathname.startsWith('/map')) return 'map'
  if (pathname.startsWith('/camera')) return 'camera'
  if (pathname.startsWith('/profile')) return 'profile'
  return null
}

function TabItem({
  to,
  label,
  icon,
  isActive,
  onGo,
}: {
  to: string
  label: string
  icon: string
  isActive: boolean
  onGo: (to: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onGo(to)}
      aria-current={isActive ? 'page' : undefined}
      className="flex flex-col items-center justify-center gap-0.5 min-w-[2.5rem] max-w-[3.25rem] shrink-0 py-0.5 px-0"
    >
      <span
        className={
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full ' +
          (isActive
            ? 'border-2 border-slate-900 bg-primary-container'
            : 'bg-transparent')
        }
      >
        <span
          className={
            'material-symbols-outlined text-[20px] leading-none ' +
            (isActive ? 'text-slate-900' : 'text-on-surface-variant')
          }
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </span>
      <span
        className={
          'font-pinkfong-nav block w-full min-w-0 px-0.5 ' +
          (isActive ? 'text-slate-900' : 'text-on-surface-variant')
        }
      >
        {label}
      </span>
    </button>
  )
}

export default function BottomNav() {
  const loc = useLocation()
  const nav = useNavigate()
  const active = activeTabFromPath(loc.pathname, loc.search)
  const go = (to: string) => nav(to)

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto w-fit max-w-[calc(100%-1.5rem)] rounded-full border-4 border-slate-900 bg-surface-container-low shadow-[0_8px_0_0_#000] px-2.5 py-2 [container-type:inline-size]">
        <div className="flex flex-row items-end justify-center gap-0.5">
          {TABS.map((tab) => (
            <TabItem
              key={tab.key}
              to={tab.to}
              label={tab.label}
              icon={tab.icon}
              isActive={active != null && active === tab.key}
              onGo={go}
            />
          ))}
        </div>
      </div>
    </nav>
  )
}
