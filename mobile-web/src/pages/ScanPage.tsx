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
      // ignore stop errors
    }
    setScanning(false)
  }, [])

  useEffect(() => {
    handledRef.current = false
    setErr('')
    setMsg('카메라에 QR 코드를 맞춰 주세요.')

    if (!navigator.mediaDevices?.getUserMedia) {
      setErr('이 브라우저는 카메라 스캔을 지원하지 않습니다. 아래에서 코드를 입력해 주세요.')
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
            : '카메라를 열 수 없습니다. 권한을 허용했는지 확인해 주세요.'
        )
      })

    return () => {
      stopScanner()
    }
  }, [handleDecoded, stopScanner])

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
          <p className="text-on-surface-variant text-sm">
            테미·포스터의 QR을 비추면 스탬프가 자동으로 적립됩니다.
          </p>
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm overflow-hidden">
          <div
            id={SCANNER_ID}
            className={
              'w-full rounded-lg overflow-hidden bg-slate-900 min-h-[280px] ' +
              (scanning ? '' : 'flex items-center justify-center')
            }
          />
          {msg && !err ? <p className="text-on-surface-variant text-sm text-center">{msg}</p> : null}
          {err ? (
            <p className="text-secondary text-sm text-center">{err}</p>
          ) : null}
        </section>

        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h3 className="font-label-bold text-on-surface text-sm">카메라가 안 될 때</h3>
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
