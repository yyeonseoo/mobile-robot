import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { key: 'home', to: '/', label: '홈', icon: 'home' },
  { key: 'events', to: '/events', label: '이벤트', icon: 'event' },
  { key: 'rally', to: '/rally', label: '스탬프 랠리', icon: 'capture' },
  { key: 'map', to: '/map', label: '포켓맵', icon: 'map' },
  { key: 'camera', to: '/camera', label: '카메라', icon: 'photo_camera' },
] as const

type TabKey = (typeof TABS)[number]['key']

const ENTER_NEXT_KEYS: TabKey[] = ['home', 'events', 'rally', 'map', 'camera']

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
      className="flex flex-1 flex-col items-center justify-center gap-0.5 min-w-0 py-0.5"
    >
      <span
        className={
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-full ' +
          (isActive
            ? 'border-2 border-slate-900 bg-primary-container'
            : 'bg-transparent')
        }
      >
        <span
          className={
            'material-symbols-outlined text-[24px] leading-none ' +
            (isActive ? 'text-slate-900' : 'text-on-surface-variant')
          }
          style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
        >
          {icon}
        </span>
      </span>
      <span
        className={
          'text-[10px] font-bold leading-tight text-center ' +
          (label.length > 4 ? 'px-0.5' : 'whitespace-nowrap') +
          ' ' +
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
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-lg min-w-[300px] rounded-full border-4 border-slate-900 bg-surface-container-low shadow-[0_8px_0_0_#000] px-2 py-2.5">
        <div className="flex w-full flex-row items-end justify-between gap-0.5">
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
