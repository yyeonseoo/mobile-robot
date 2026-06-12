import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { extractClaimCode } from '../lib/parseQrScan'

const SCANNER_ID = 'qr-camera-reader'

export default function ScanPage() {
  const nav = useNavigate()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const handledRef = useRef(false)

  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [manual, setManual] = useState('')
  const [scanning, setScanning] = useState(false)
  const [tryInApp, setTryInApp] = useState(false)

  const handleDecoded = useCallback(
    (raw: string) => {
      if (handledRef.current) return
      const code = extractClaimCode(raw)
      if (!code) {
        setMsg('인식할 수 없는 QR입니다.')
        return
      }
      handledRef.current = true
      setMsg(`인식됨: ${code}`)
      nav(`/rally?claim=${encodeURIComponent(code)}`)
    },
    [nav]
  )

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current
    scannerRef.current = null
    if (!s) return
    try {
      if (s.isScanning) await s.stop()
      await s.clear()
    } catch {
      // ignore
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    if (!tryInApp) return

    handledRef.current = false
    setErr('')
    setMsg('카메라에 QR 코드를 맞춰 주세요.')

    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('이 브라우저는 앱 내 카메라 스캔을 지원하지 않습니다. 기본 카메라 앱을 이용해 주세요.')
      return
    }

    const scanner = new Html5Qrcode(SCANNER_ID)
    scannerRef.current = scanner

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        (decoded) => handleDecoded(decoded),
        () => {}
      )
      .then(() => setScanning(true))
      .catch((e: unknown) => {
        setErr(
          e instanceof Error
            ? e.message
            : '카메라를 열 수 없습니다. 휴대폰 기본 카메라 앱으로 QR을 스캔해 주세요.'
        )
      })

    return () => {
      void stopScanner()
    }
  }, [tryInApp, handleDecoded, stopScanner])

  function submitManual() {
    const v = manual.trim()
    if (!v) {
      setMsg('코드를 입력하세요.')
      return
    }
    handleDecoded(v)
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <AppHeader
        right={
          <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">
            qr_code_scanner
          </span>
        }
      />

      <main className={`${APP_HEADER_MAIN_PT} px-gutter max-w-2xl mx-auto space-y-gutter`}>
        <section className="text-center space-y-xs">
          <h2 className="font-headline-md text-headline-md text-on-surface">QR 스캔</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            스탬프 랠리 QR은 <strong className="text-on-surface">휴대폰 기본 카메라 앱</strong>으로
            스캔하는 것을 권장합니다. 스캔 후 표시되는 링크를 눌러 이 앱으로 돌아오면 스탬프가
            적립됩니다.
          </p>
        </section>

        <section className="bg-primary-container/30 border-2 border-primary/25 rounded-lg p-md space-y-sm">
          <h3 className="font-label-bold text-on-surface text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">photo_camera</span>
            기본 카메라 앱으로 스캔하기
          </h3>
          <ol className="text-sm text-on-surface-variant list-decimal list-inside space-y-1">
            <li>휴대폰 홈 화면에서 <strong>카메라</strong> 앱을 엽니다.</li>
            <li>전시장 포스터·테미 화면의 QR을 비춥니다.</li>
            <li>알림이 뜨면 링크를 눌러 POKÉGUIDE로 이동합니다.</li>
          </ol>
        </section>

        {!tryInApp ? (
          <button
            type="button"
            className="w-full bg-white border-8 border-white rounded-lg py-3 font-bold text-on-surface neomorph-card"
            onClick={() => setTryInApp(true)}
          >
            앱 내 카메라로 시도하기 (일부 기기만 가능)
          </button>
        ) : (
          <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm overflow-hidden">
            <div
              id={SCANNER_ID}
              className={
                'w-full rounded-lg overflow-hidden bg-slate-900 min-h-[280px] ' +
                (scanning ? '' : 'flex items-center justify-center')
              }
            />
            {msg && !err ? <p className="text-on-surface-variant text-sm text-center">{msg}</p> : null}
            {err ? <p className="text-secondary text-sm text-center">{err}</p> : null}
          </section>
        )}

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h3 className="font-label-bold text-on-surface text-sm">코드 직접 입력</h3>
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="예: RALLY-1 또는 QR URL"
            className="w-full rounded-lg border-2 border-surface-variant bg-white px-4 py-3"
            autoComplete="off"
          />
          <button
            type="button"
            className="w-full bg-primary-container text-on-primary-fixed rounded-lg py-3 font-bold toy-button-shadow-light"
            onClick={submitManual}
          >
            코드로 적립하기
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
