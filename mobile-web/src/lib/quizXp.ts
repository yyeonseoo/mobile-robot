export const QUIZ_XP_STORAGE_KEY = 'pokemonFestivalQuizXp'
export const XP_PER_LEVEL = 2000

const RANK_TITLES = [
  '견습 연구원',
  '초급 연구원',
  '중급 연구원',
  '상급 연구원',
  '마스터 연구원',
] as const

export function loadQuizXp(): number {
  try {
    const raw = localStorage.getItem(QUIZ_XP_STORAGE_KEY)
    const n = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function saveQuizXp(xp: number) {
  try {
    localStorage.setItem(QUIZ_XP_STORAGE_KEY, String(Math.max(0, xp)))
  } catch {
    /* ignore */
  }
}

export function xpGainForAnswer(rewardLabel: string | undefined, correct: boolean): number {
  if (correct) {
    const m = (rewardLabel || '').match(/(\d+)/)
    return m ? parseInt(m[1], 10) : 50
  }
  return 15
}

export function getQuizRank(totalXp: number) {
  const level = Math.floor(totalXp / XP_PER_LEVEL)
  const xpInLevel = totalXp % XP_PER_LEVEL
  const pct = XP_PER_LEVEL > 0 ? (xpInLevel / XP_PER_LEVEL) * 100 : 0
  const title = RANK_TITLES[Math.min(level, RANK_TITLES.length - 1)]
  return { level: level + 1, xpInLevel, pct, title, totalXp }
}

export function formatXp(n: number) {
  return n.toLocaleString('ko-KR')
}
