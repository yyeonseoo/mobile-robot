import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import { jsonFetch } from '../lib/api'

type SessionResp = { photos?: string[] }

export default function PhotoReceivePage() {
  const [params] = useSearchParams()
  const token = useMemo(() => (params.get('token') || '').trim(), [params])
  const [err, setErr] = useState('')
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    ;(async () => {
      if (!token) {
        setErr('토큰이 없습니다. 키오스크에서 다시 QR을 받아 주세요.')
        return
      }
      try {
        const data = await jsonFetch<SessionResp>(`/api/photo-booth/sessions/${encodeURIComponent(token)}`)
        const list = data.photos || []
        if (!list.length) {
          setErr('아직 올라온 사진이 없습니다. 키오스크에서 업로드가 끝난 뒤 다시 시도해 주세요.')
          return
        }
        setPhotos(list)
      } catch (e) {
        setErr(e instanceof Error ? e.message : '불러오기에 실패했습니다.')
      }
    })()
  }, [token])

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <header className="bg-yellow-400 dark:bg-yellow-600 flex justify-between items-center w-full px-6 py-4 fixed top-0 z-50 border-b-4 border-yellow-600 dark:border-yellow-800 shadow-xl">
        <div className="flex items-center gap-4">
          <Link
            to="/camera"
            className="active:translate-y-0.5 transition-transform hover:opacity-80 transition-opacity text-slate-900 dark:text-white"
            aria-label="뒤로"
          >
            <span className="material-symbols-outlined text-3xl">arrow_back</span>
          </Link>
          <h1 className="text-2xl font-extrabold italic text-slate-900 dark:text-white tracking-tighter font-['Plus_Jakarta_Sans']">
            PHOTO
          </h1>
        </div>
        <span className="material-symbols-outlined text-3xl text-slate-900 dark:text-white">download</span>
      </header>

      <main className="pt-24 px-gutter max-w-2xl mx-auto space-y-gutter">
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">촬영한 사진</h2>
          <p className="text-on-surface-variant text-sm">
            사진을 길게 눌러 저장하거나, 타일을 눌러 다운로드하세요.
          </p>
        </section>

        {err ? (
          <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card text-secondary">
            {err}
          </section>
        ) : null}

        <section className="grid grid-cols-2 gap-gutter">
          {photos.map((url, i) => {
            const abs = url.startsWith('http') ? url : `${location.origin}${url}`
            return (
              <a
                key={`${abs}-${i}`}
                className="bg-white border-8 border-white rounded-lg overflow-hidden neomorph-card block"
                href={abs}
                download={`photo-${i + 1}.png`}
                target="_blank"
                rel="noopener"
              >
                <img src={abs} alt={`사진 ${i + 1}`} className="w-full aspect-[4/3] object-cover block" />
                <div className="p-sm font-bold text-center text-on-surface">{`사진 ${i + 1} 저장`}</div>
              </a>
            )
          })}
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

