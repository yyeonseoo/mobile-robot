import AppHeader, { APP_HEADER_MAIN_PT } from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { clearNickname, clearVisitorToken, getNickname, getVisitorToken } from '../lib/storage'
import { useState } from 'react'

export default function ProfilePage() {
  const [token, setToken] = useState(() => getVisitorToken())
  const [nick, setNick] = useState(() => getNickname())

  function reset() {
    clearVisitorToken()
    clearNickname()
    setToken('')
    setNick('')
    alert('세션을 초기화했습니다.')
  }

  return (
    <div className="bg-background pokeball-bg min-h-screen font-body-md text-on-background pb-32">
      <AppHeader />

      <main className={`${APP_HEADER_MAIN_PT} px-gutter max-w-2xl mx-auto space-y-gutter`}>
        <section className="bg-white border-8 border-white rounded-lg p-md neomorph-card space-y-sm">
          <h2 className="font-headline-md text-headline-md text-on-surface">세션 정보</h2>
          <p className="text-on-surface-variant text-sm">
            토큰이 있어야 랠리/전시 API가 동작합니다.
          </p>
          <div className="space-y-xs">
            <div className="flex justify-between gap-3">
              <span className="text-on-surface-variant">닉네임</span>
              <span className="font-bold text-on-surface">{nick || '없음'}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-on-surface-variant">토큰</span>
              <span className="font-bold text-on-surface">{token ? '연결됨' : '없음'}</span>
            </div>
          </div>
          <button
            type="button"
            className="w-full bg-surface-container-low text-on-surface rounded-lg py-3 font-bold toy-button-shadow-light"
            onClick={reset}
          >
            세션 초기화
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}

