/** Common app navigation tabs used by the home grid and bottom navigation. */
export const APP_TABS = [
  { key: 'home', to: '/', label: '홈', icon: 'home' },
  { key: 'events', to: '/events', label: '이벤트', icon: 'event' },
  { key: 'rally', to: '/rally', label: '스탬프 랠리', icon: 'capture' },
  { key: 'map', to: '/map', label: '포켓맵', icon: 'map' },
  { key: 'camera', to: '/camera', label: '카메라', icon: 'photo_camera' },
  { key: 'profile', to: '/profile', label: '프로필', icon: 'person' },
] as const

export type AppTabKey = (typeof APP_TABS)[number]['key']

export const ENTER_NEXT_KEYS: AppTabKey[] = [
  'home',
  'events',
  'rally',
  'map',
  'camera',
  'profile',
]

/** Home screen menu keeps the main four feature cards only. */
export const HOME_MENU_TABS = APP_TABS.filter((t) => t.key !== 'home' && t.key !== 'profile')
