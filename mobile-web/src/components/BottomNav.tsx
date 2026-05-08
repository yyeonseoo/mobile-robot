import { useLocation, useNavigate } from 'react-router-dom'

type TabKey = 'map' | 'rally' | 'scan' | 'profile'

function activeTabFromPath(pathname: string): TabKey {
  if (pathname.startsWith('/map')) return 'map'
  if (pathname.startsWith('/rally')) return 'rally'
  if (pathname.startsWith('/scan')) return 'scan'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'map'
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
  if (isActive) {
    return (
      <button
        type="button"
        onClick={() => onGo(to)}
        className="flex items-center justify-center h-16 px-4 rounded-full border-4 border-slate-900 bg-white shadow-[0_6px_0_0_rgba(0,0,0,0.12)]"
        aria-current="page"
      >
        <div className="w-12 h-12 rounded-full bg-primary-container flex flex-col items-center justify-center">
          <span
            className="material-symbols-outlined text-slate-900 leading-none"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
          <span className="text-[11px] font-bold leading-none text-slate-900 mt-0.5">
            {label}
          </span>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onGo(to)}
      className="flex flex-col items-center justify-center w-16 h-16 text-slate-400 hover:text-slate-700 transition-colors"
    >
      <span className="material-symbols-outlined text-2xl leading-none">{icon}</span>
      <span className="text-[11px] font-bold leading-none mt-1">{label}</span>
    </button>
  )
}

export default function BottomNav() {
  const loc = useLocation()
  const nav = useNavigate()
  const active = activeTabFromPath(loc.pathname)
  const go = (to: string) => nav(to)

  return (
    <nav className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-[92%] max-w-md bg-white rounded-full border-4 border-slate-900 shadow-[0_10px_0_0_rgba(0,0,0,0.9)] px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <TabItem to="/map" label="지도" icon="map" isActive={active === 'map'} onGo={go} />
          <TabItem to="/rally" label="랠리" icon="capture" isActive={active === 'rally'} onGo={go} />
          <TabItem to="/scan" label="스캔" icon="qr_code_scanner" isActive={active === 'scan'} onGo={go} />
          <TabItem to="/profile" label="정보" icon="person" isActive={active === 'profile'} onGo={go} />
        </div>
      </div>
    </nav>
  )
}

