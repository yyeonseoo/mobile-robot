type SocketLike = {
  connected: boolean
  on: (event: string, handler: (...args: unknown[]) => void) => void
  off?: (event: string, handler?: (...args: unknown[]) => void) => void
  emit: (event: string, payload?: unknown, ack?: (res: unknown) => void) => void
  connect?: () => void
  disconnect?: () => void
}

type IoFactory = (
  url: string,
  opts?: { query?: Record<string, string>; transports?: string[]; reconnection?: boolean }
) => SocketLike

declare global {
  interface Window {
    io?: IoFactory
  }
}

let sharedSocket: SocketLike | null = null
let loadPromise: Promise<void> | null = null

export function socketBaseUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000'
  return `${window.location.protocol}//${window.location.hostname}:3000`
}

function loadSocketClient(): Promise<void> {
  if (window.io) return Promise.resolve()
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `${socketBaseUrl()}/socket.io/socket.io.js`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Socket.IO 클라이언트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })

  return loadPromise
}

export async function getTemiSocket(): Promise<SocketLike> {
  await loadSocketClient()
  if (!window.io) throw new Error('Socket.IO를 사용할 수 없습니다.')

  if (sharedSocket?.connected) return sharedSocket

  if (!sharedSocket) {
    sharedSocket = window.io(socketBaseUrl(), {
      query: { room: 'app' },
      transports: ['websocket', 'polling'],
      reconnection: true,
    })
  } else {
    sharedSocket.connect?.()
  }

  return new Promise((resolve, reject) => {
    const socket = sharedSocket!
    if (socket.connected) {
      resolve(socket)
      return
    }

    const onConnect = () => {
      socket.off?.('connect', onConnect)
      socket.off?.('connect_error', onError)
      resolve(socket)
    }
    const onError = (err: unknown) => {
      socket.off?.('connect', onConnect)
      socket.off?.('connect_error', onError)
      reject(err instanceof Error ? err : new Error('소켓 연결 실패'))
    }

    socket.on('connect', onConnect)
    socket.on('connect_error', onError)
  })
}

export async function emitPhotoBoothStart(mode = 'fourcut'): Promise<void> {
  const socket = await getTemiSocket()
  await new Promise<void>((resolve, reject) => {
    socket.emit('app:photo_booth_start', { mode, source: 'mobile-web' }, (res) => {
      const body = res as { ok?: boolean; message?: string } | undefined
      if (body && body.ok === false) {
        reject(new Error(body.message || '테미 촬영 시작에 실패했습니다.'))
        return
      }
      resolve()
    })
    window.setTimeout(resolve, 1200)
  })
}

export async function emitGotoHomebase(): Promise<void> {
  const socket = await getTemiSocket()
  await new Promise<void>((resolve, reject) => {
    socket.emit('app:goto', { locationId: 'homebase', source: 'mobile-web' }, (res) => {
      const body = res as { ok?: boolean; message?: string } | undefined
      if (body && body.ok === false) {
        reject(new Error(body.message || '이동 명령에 실패했습니다.'))
        return
      }
      resolve()
    })
    window.setTimeout(resolve, 1200)
  })
}

export type PhotoResultPayload = {
  token?: string
  viewUrl?: string
}

export async function onPhotoResult(handler: (payload: PhotoResultPayload) => void): Promise<() => void> {
  const socket = await getTemiSocket()
  const wrapped = (payload: unknown) => handler((payload || {}) as PhotoResultPayload)
  socket.on('app:photo_result', wrapped)
  return () => socket.off?.('app:photo_result', wrapped)
}
