/** RequireSession → /enter?next=… 및 입장 후 복귀 경로 */
export const NEXT_TO_PATH: Record<string, string> = {
  home: '/',
  map: '/map',
  rally: '/rally',
  scan: '/scan',
  profile: '/profile',
}

export function nextKeyFromPathname(pathname: string): string {
  if (pathname.startsWith('/map')) return 'map'
  if (pathname.startsWith('/rally')) return 'rally'
  if (pathname.startsWith('/scan')) return 'scan'
  if (pathname.startsWith('/profile')) return 'profile'
  return ''
}

export function pathFromNextKey(next: string): string | null {
  return NEXT_TO_PATH[next] ?? null
}
