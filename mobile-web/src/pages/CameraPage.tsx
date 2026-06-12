import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { emitPhotoBoothStart, onPhotoResult } from '../lib/temiSocket'

type BoothStatus = 'idle' | 'starting' | 'waiting' | 'error'

export default function CameraPage() {
  const nav = useNavigate()
  const [status, setStatus] = useState<BoothStatus>('idle')
  const [message, setMessage] = useState(
    '전시장 테미 화면에서 인생네컷을 촬영합니다. 아래 버튼을 누르면 테미 카메라가 켜집니다.'
  )

  useEffect(() => {
    let off: (() => void) | undefined
    void onPhotoResult((payload) => {
      const token = payload.token || ''
      const viewUrl = payload.viewUrl || (token ? `/mobile/app/photo/receive?token=${encodeURIComponent(token)}` : '')
      if (!viewUrl) return
      try {
        const url = new URL(viewUrl, window.location.origin)
        nav(`${url.pathname}${url.search}`)
      } catch {
        nav(viewUrl.startsWith('/') ? viewUrl : `/photo/receive?token=${encodeURIComponent(token)}`)
      }
    }).then((cleanup) => {
      off = cleanup
    })

    return () => off?.()
  }, [nav])

  async function startTemiShoot() {
    setStatus('starting')
    setMessage('테미에 촬영 명령을 보내는 중…')
    try {
      await emitPhotoBoothStart('fourcut')
      setStatus('waiting')
      setMessage(
        '테미 화면에서 인생네컷을 촬영해 주세요. 촬영이 끝나면 이 화면으로 사진이 자동 전송되며, QR로도 받을 수 있습니다.'
      )
    } catch (e) {
      setStatus('error')
      setMessage(
        e instanceof Error
          ? e.message
          : '테미 연결에 실패했습니다. 소켓 서버(포트 3000)와 테미 앱이 켜져 있는지 확인해 주세요.'
      )
    }
  }

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
      <AppHeader />

      <main className={`mx-auto w-full max-w-2xl px-gutter ${APP_HEADER_MAIN_PT} space-y-gutter`}>
        <section className="text-center space-y-sm">
          <h2 className="font-display-lg text-display-lg text-primary leading-tight">인생네컷 찍기</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            휴대폰 브라우저 카메라 대신 <strong className="text-on-surface">전시장 테미</strong>에서 촬영합니다.
            촬영 후 결과는 이 앱으로 바로 전송됩니다.
          </p>
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-lg neomorph-card space-y-md text-center">
          <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-primary-container border-4 border-primary/30">
            <span
              className="material-symbols-outlined text-5xl text-on-primary-container"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              photo_camera
            </span>
          </div>

          <p className="text-on-surface text-sm leading-relaxed whitespace-pre-line">{message}</p>

          <button
            type="button"
            disabled={status === 'starting' || status === 'waiting'}
            onClick={() => void startTemiShoot()}
            className="w-full bg-secondary-container text-white font-label-bold py-4 rounded-full neomorph-button disabled:opacity-60 text-lg"
          >
            {status === 'starting'
              ? '연결 중…'
              : status === 'waiting'
                ? '테미에서 촬영 중…'
                : '테미에서 촬영 시작'}
          </button>

          {status === 'waiting' ? (
            <button
              type="button"
              className="text-sm font-bold text-tertiary underline underline-offset-2"
              onClick={() => {
                setStatus('idle')
                setMessage('다시 촬영하려면 버튼을 눌러 주세요.')
              }}
            >
              다시 시작하기
            </button>
          ) : null}
        </section>

        <section className="bg-surface-container-low rounded-lg p-md border-2 border-surface-variant space-y-xs text-sm text-on-surface-variant">
          <p className="font-label-bold text-on-surface">촬영 흐름</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>이 화면에서 「테미에서 촬영 시작」을 누릅니다.</li>
            <li>테미 키오스크 화면에서 4컷을 촬영합니다.</li>
            <li>촬영이 끝나면 사진이 자동으로 이 앱에 표시됩니다.</li>
            <li>또는 테미 화면 QR을 스캔해 받을 수도 있습니다.</li>
          </ol>
        </section>

        <section className="flex gap-gutter">
          <Link
            to="/photo/receive"
            className="flex-1 bg-white border-8 border-white rounded-lg p-md neomorph-card text-center"
          >
            <span className="material-symbols-outlined text-3xl text-tertiary">qr_code_scanner</span>
            <p className="mt-sm font-label-bold text-on-surface text-sm">QR로 사진 받기</p>
          </Link>
          <Link
            to="/profile"
            className="flex-1 bg-white border-8 border-white rounded-lg p-md neomorph-card text-center"
          >
            <span className="material-symbols-outlined text-3xl text-primary">photo_library</span>
            <p className="mt-sm font-label-bold text-on-surface text-sm">내 갤러리</p>
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
