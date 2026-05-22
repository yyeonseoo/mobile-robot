import { useEffect, useRef, useState } from 'react'
import {
  XP_PER_LEVEL,
  formatXp,
  getQuizRank,
  loadQuizXp,
  saveQuizXp,
  xpGainForAnswer,
} from '../lib/quizXp'
import {
  type DailyChallenge,
  callDailyChallenge,
  checkMemoryAnswer,
  checkTextAnswer,
} from '../lib/challengeApi'

const DAILY_CHALLENGES = [
  {
    type: 'puzzle',
    label: '퍼즐',
    icon: 'extension',
    bg: 'bg-primary-fixed border-primary text-on-primary-fixed',
  },
  {
    type: 'race',
    label: '레이스',
    icon: 'speed',
    bg: 'bg-secondary-fixed border-secondary text-on-secondary-fixed',
  },
  {
    type: 'quiz',
    label: '일일 퀴즈',
    icon: 'quiz',
    bg: 'bg-tertiary-fixed border-tertiary text-on-tertiary-fixed',
  },
  {
    type: 'memory',
    label: '메모리',
    icon: 'auto_awesome',
    bg: 'bg-surface-container-highest border-outline text-on-surface',
  },
] as const

type Props = {
  topic?: string
  onToast: (msg: string) => void
}

export default function DailyChallengePanel({ topic, onToast }: Props) {
  const [activeType, setActiveType] = useState<string | null>(null)
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [quizPick, setQuizPick] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [memoryAnswer, setMemoryAnswer] = useState('')
  const [showMemoryCards, setShowMemoryCards] = useState(true)
  const [quizXp, setQuizXp] = useState(loadQuizXp)
  const [lastXpGain, setLastXpGain] = useState(0)
  const xpAwardedRef = useRef(false)

  const quizRank = getQuizRank(quizXp)

  function isCorrect(ch: DailyChallenge) {
    if (ch.options.length >= 2) return quizPick === ch.answerIndex
    if (ch.type === 'puzzle') return checkTextAnswer(textAnswer, ch)
    if (ch.type === 'memory') return checkMemoryAnswer(memoryAnswer, ch)
    return false
  }

  useEffect(() => {
    if (!submitted || !challenge || xpAwardedRef.current) return
    xpAwardedRef.current = true
    const gain = xpGainForAnswer(challenge.rewardLabel, isCorrect(challenge))
    setLastXpGain(gain)
    setQuizXp((prev) => {
      const next = prev + gain
      saveQuizXp(next)
      return next
    })
  }, [submitted, challenge, quizPick, textAnswer, memoryAnswer])

  async function startChallenge(type: string) {
    setActiveType(type)
    setChallenge(null)
    setError('')
    setQuizPick(null)
    setSubmitted(false)
    setTextAnswer('')
    setMemoryAnswer('')
    setLastXpGain(0)
    xpAwardedRef.current = false
    setShowMemoryCards(true)
    setBusy(true)
    try {
      const data = await callDailyChallenge(type, topic)
      setChallenge(data)
      if (data.type === 'memory' && data.memoryCards.length > 0) {
        window.setTimeout(() => setShowMemoryCards(false), Math.min(data.timeLimitSec, 12) * 1000)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '챌린지 생성 실패')
    } finally {
      setBusy(false)
    }
  }

  function submitAnswer() {
    if (!challenge || submitted) return
    if (challenge.options.length >= 2) {
      if (quizPick === null) return
      setSubmitted(true)
      onToast(quizPick === challenge.answerIndex ? `정답! ${challenge.rewardLabel}` : '아쉬워요!')
      return
    }
    if (challenge.type === 'puzzle') {
      const ok = checkTextAnswer(textAnswer, challenge)
      setSubmitted(true)
      setQuizPick(ok ? challenge.answerIndex : -1)
      onToast(ok ? `정답! ${challenge.rewardLabel}` : '아쉬워요!')
      return
    }
    if (challenge.type === 'memory') {
      if (!memoryAnswer.trim()) {
        onToast('기억한 순서를 입력해 주세요.')
        return
      }
      const ok = checkMemoryAnswer(memoryAnswer, challenge)
      setSubmitted(true)
      setQuizPick(ok ? 0 : -1)
      onToast(ok ? `정답! ${challenge.rewardLabel}` : '아쉬워요!')
    }
  }

  return (
    <>
      <section id="daily-challenge" className="space-y-6 scroll-mt-28">
        <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">sports_esports</span>
          일일 챌린지
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {DAILY_CHALLENGES.map((ch) => (
            <button
              key={ch.type}
              type="button"
              disabled={busy && activeType === ch.type}
              className={
                'p-6 rounded-lg border-4 text-center space-y-2 transition-all cursor-pointer disabled:opacity-60 ' +
                ch.bg +
                (activeType === ch.type ? ' ring-4 ring-tertiary ring-offset-2 scale-[1.02]' : '')
              }
              onClick={() => startChallenge(ch.type)}
            >
              <div className="w-12 h-12 bg-white rounded-full mx-auto flex items-center justify-center border-2 border-current/30">
                <span className="material-symbols-outlined">{ch.icon}</span>
              </div>
              <p className="font-label-bold">{ch.label}</p>
            </button>
          ))}
        </div>

        {busy ? (
          <p className="text-center text-on-surface-variant font-body-md py-4">
            테미가 오늘의 챌린지를 만들고 있어요…
          </p>
        ) : null}

        {error ? (
          <p className="text-center text-secondary font-label-bold text-sm py-2">{error}</p>
        ) : null}

        {challenge && !busy ? (
          <div className="bg-white rounded-lg border-4 border-tertiary/25 p-6 toy-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h4 className="font-headline-md text-on-surface">{challenge.title}</h4>
                <p className="text-sm text-on-surface-variant mt-1">{challenge.instruction}</p>
              </div>
              <span className="bg-primary-container text-on-primary-container font-label-bold text-xs px-3 py-1 rounded-full">
                {challenge.rewardLabel}
              </span>
            </div>

            <p className="text-on-surface font-body-md leading-relaxed whitespace-pre-wrap">
              {challenge.body}
            </p>

            {challenge.options.length >= 2 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {challenge.options.map((opt, idx) => {
                    const selected = quizPick === idx
                    const correct = submitted && idx === challenge.answerIndex
                    const wrong = submitted && selected && idx !== challenge.answerIndex
                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={submitted}
                        className={
                          'text-left px-4 py-3 rounded-full border-2 font-label-bold text-sm transition-colors ' +
                          (correct
                            ? 'border-green-500 bg-green-50 text-green-800'
                            : wrong
                              ? 'border-red-400 bg-red-50 text-red-800'
                              : selected
                                ? 'border-tertiary bg-tertiary/10 ring-2 ring-tertiary/30'
                                : 'border-tertiary/30 hover:border-tertiary hover:bg-tertiary/5')
                        }
                        onClick={() => setQuizPick(idx)}
                      >
                        {idx + 1}. {opt}
                      </button>
                    )
                  })}
                </div>
                {!submitted ? (
                  <button
                    type="button"
                    disabled={quizPick === null}
                    className="w-full py-3 rounded-full bg-tertiary text-white font-label-bold text-sm disabled:opacity-50"
                    onClick={submitAnswer}
                  >
                    정답 제출
                  </button>
                ) : null}
              </div>
            ) : challenge.type === 'puzzle' ? (
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  value={textAnswer}
                  disabled={submitted}
                  placeholder="포켓몬 이름을 입력하세요"
                  className="flex-1 min-w-[180px] px-4 py-3 rounded-full border-2 border-tertiary/30 text-sm font-body-md"
                  onChange={(e) => setTextAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !submitted) {
                      e.preventDefault()
                      submitAnswer()
                    }
                  }}
                />
                {!submitted ? (
                  <button
                    type="button"
                    className="px-6 py-3 rounded-full bg-tertiary text-white font-label-bold text-sm"
                    onClick={submitAnswer}
                  >
                    정답 제출
                  </button>
                ) : null}
              </div>
            ) : null}

            {challenge.type === 'memory' && challenge.memoryCards.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-label-bold text-tertiary">
                  {showMemoryCards
                    ? `${challenge.timeLimitSec}초 동안 기억하세요!`
                    : '카드를 숨겼어요. 순서를 말해 보세요!'}
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {challenge.memoryCards.map((card) => (
                    <div
                      key={card}
                      className="aspect-square rounded-lg bg-tertiary/10 border-2 border-tertiary/20 flex items-center justify-center text-center text-xs font-label-bold p-2"
                    >
                      {showMemoryCards || submitted ? card : '?'}
                    </div>
                  ))}
                </div>
                {!showMemoryCards && !submitted ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={memoryAnswer}
                      placeholder="왼쪽부터 순서대로 입력 (예: 피카츄, 라이츄, 파이츄 …)"
                      className="w-full px-4 py-3 rounded-full border-2 border-tertiary/30 text-sm font-body-md"
                      onChange={(e) => setMemoryAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          submitAnswer()
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="w-full bg-tertiary text-white font-label-bold py-3 rounded-full"
                      onClick={submitAnswer}
                    >
                      정답 제출
                    </button>
                  </div>
                ) : null}
                {submitted && challenge.type === 'memory' ? (
                  <p className="text-xs text-on-surface-variant">
                    정답 순서: {challenge.memoryCards.join(' → ')}
                  </p>
                ) : null}
              </div>
            ) : null}

            {challenge.type === 'race' && challenge.hint && !submitted ? (
              <button
                type="button"
                className="w-full border-2 border-dashed border-primary/40 text-primary font-label-bold py-3 rounded-full"
                onClick={() => onToast(challenge.hint)}
              >
                힌트 보기
              </button>
            ) : null}

            {submitted ? (
              <div className="text-sm text-on-surface-variant bg-surface-container-low rounded-lg p-4 space-y-2">
                <p className="font-label-bold text-on-surface">
                  {isCorrect(challenge)
                    ? `정답! ${challenge.rewardLabel}`
                    : '오답이에요. 다시 도전해 보세요!'}
                </p>
                {challenge.hint ? (
                  <p className="whitespace-pre-wrap">{challenge.hint}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="bg-white p-8 rounded-lg border-4 border-surface-variant toy-card space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">나의 퀴즈 랭크</h3>
            <p className="text-on-surface-variant">
              {quizRank.title}
              {quizRank.level > 1 ? ` · Lv.${quizRank.level}` : ''}
            </p>
          </div>
          <div className="w-16 h-16 bg-yellow-400 rounded-full border-4 border-slate-900 flex items-center justify-center shadow-lg">
            <span
              className="material-symbols-outlined text-slate-900"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-label-bold text-on-surface">
            <span>경험치 진행도</span>
            <span>
              {formatXp(quizRank.xpInLevel)} / {formatXp(XP_PER_LEVEL)}
              {lastXpGain > 0 ? <span className="text-tertiary ml-1">+{lastXpGain}</span> : null}
            </span>
          </div>
          <div className="h-6 w-full bg-surface-container rounded-full overflow-hidden border-2 border-surface-variant">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full relative transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, quizRank.pct))}%` }}
            >
              <div className="absolute inset-0 bg-white/20 h-2 top-1 rounded-full mx-2" />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
