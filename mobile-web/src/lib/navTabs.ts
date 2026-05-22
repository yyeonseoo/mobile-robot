/** 홈 그리드·하단 네비에서 공통으로 쓰는 탭 정의 */
export const APP_TABS = [
  { key: 'home', to: '/', label: '홈', icon: 'home' },
  { key: 'events', to: '/events', label: '이벤트', icon: 'event' },
  { key: 'rally', to: '/rally', label: '스탬프 랠리', icon: 'capture' },
  { key: 'map', to: '/map', label: '포켓맵', icon: 'map' },
  { key: 'camera', to: '/camera', label: '카메라', icon: 'photo_camera' },
] as const

export type AppTabKey = (typeof APP_TABS)[number]['key']

export const ENTER_NEXT_KEYS: AppTabKey[] = ['home', 'events', 'rally', 'map', 'camera']

/** 홈 2×2 메뉴 (홈 탭 제외, 하단 바와 동일 순서) */
export const HOME_MENU_TABS = APP_TABS.filter((t) => t.key !== 'home')
