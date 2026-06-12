import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { jsonFetch } from '../lib/api'
import { getVisitorToken } from '../lib/storage'
import { uploadVisitorPhoto } from '../lib/visitorApi'

type SessionResp = { photos?: string[] }

const POLL_MS = 2000
const POLL_MAX = 30

export default function PhotoReceivePage() {
  const [params] = useSearchParams()
  const token = useMemo(() => (params.get('token') || '').trim(), [params])
  const [err, setErr] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(!!token)
  const [savedProfile, setSavedProfile] = useState(false)

  useEffect(() => {
    if (!token) {
      setErr('토큰이 없습니다. 테미 화면의 QR을 스캔하거나, 촬영 완료 후 자동 이동을 기다려 주세요.')
      setLoading(false)
      return
    }

    let cancelled = false
    let attempts = 0

    async function fetchOnce() {
      try {
        const data = await jsonFetch<SessionResp>(
          `/api/photo-booth/sessions/${encodeURIComponent(token)}`
        )
        const list = data.photos || []
        if (list.length) {
          if (!cancelled) {
            setPhotos(list)
            setErr('')
            setLoading(false)
          }
          return true
        }
      } catch (e) {
        if (!cancelled && attempts >= POLL_MAX - 1) {
          setErr(e instanceof Error ? e.message : '불러오기에 실패했습니다.')
          setLoading(false)
        }
      }
      return false
    }

    ;(async () => {
      while (!cancelled && attempts < POLL_MAX) {
        const done = await fetchOnce()
        if (done) break
        attempts += 1
        if (!cancelled) {
          setLoading(true)
          setErr('사진을 기다리는 중… 테미에서 촬영·업로드가 끝날 때까지 잠시만 기다려 주세요.')
        }
        await new Promise((r) => window.setTimeout(r, POLL_MS))
      }
      if (!cancelled && !photos.length && attempts >= POLL_MAX) {
        setLoading(false)
        setErr('아직 사진이 도착하지 않았습니다. 테미에서 촬영이 끝났는지 확인한 뒤 새로고침해 주세요.')
      }
    })()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!photos.length || savedProfile || !getVisitorToken()) return
    const main = photos[photos.length - 1]
    void (async () => {
      try {
        const res = await fetch(main.startsWith('http') ? main : `${location.origin}${main}`)
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onload = () => {
          const dataUrl = typeof reader.result === 'string' ? reader.result : ''
          if (!dataUrl) return
          uploadVisitorPhoto(dataUrl, 'temi-fourcut')
            .then(() => setSavedProfile(true))
            .catch(() => {})
        }
        reader.readAsDataURL(blob)
      } catch {
        // optional profile save
      }
    })()
  }, [photos, savedProfile])

  function absUrl(url: string) {
    return url.startsWith('http') ? url : `${location.origin}${url}`
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <AppHeader backTo="/camera" />

      <main className={`${APP_HEADER_MAIN_PT} px-gutter max-w-2xl mx-auto space-y-gutter`}>
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">촬영한 사진</h2>
          <p className="text-on-surface-variant text-sm leading-relaxed">
            아래 「저장하기」를 누르면 휴대폰에 다운로드됩니다. iPhone은 사진 앱에 저장하려면
            다운로드 후 공유 메뉴를 이용해 주세요.
          </p>
          {savedProfile ? (
            <p className="text-xs font-bold text-tertiary">프로필 갤러리에도 저장되었습니다.</p>
          ) : null}
        </section>

        {loading ? (
          <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card text-on-surface-variant text-sm text-center">
            사진을 불러오는 중…
          </section>
        ) : null}

        {err && !photos.length ? (
          <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card text-secondary text-sm">
            {err}
          </section>
        ) : null}

        {photos.length ? (
          <section className="space-y-gutter">
            {photos.map((url, i) => {
              const abs = absUrl(url)
              const isMain = i === photos.length - 1
              return (
                <div
                  key={`${abs}-${i}`}
                  className={
                    'bg-white border-8 border-white rounded-lg overflow-hidden neomorph-card ' +
                    (isMain ? 'ring-4 ring-primary-container' : '')
                  }
                >
                  <img
                    src={abs}
                    alt={`사진 ${i + 1}`}
                    className="w-full object-contain bg-slate-100"
                  />
                  <div className="p-md flex flex-col gap-2">
                    <a
                      className="w-full text-center bg-primary-container text-on-primary-container font-label-bold py-3 rounded-full neomorph-button"
                      href={abs}
                      download={`pokeguide-fourcut-${i + 1}.png`}
                      target="_blank"
                      rel="noopener"
                    >
                      저장하기
                    </a>
                    {isMain ? (
                      <p className="text-xs text-center text-on-surface-variant">
                        길게 눌러 「이미지 저장」도 가능합니다.
                      </p>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </section>
        ) : null}
      </main>

      <BottomNav />
    </div>
  )
}
