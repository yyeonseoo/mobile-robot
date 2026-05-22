export type DailyChallenge = {
  type: string
  title: string
  instruction: string
  body: string
  options: string[]
  answerIndex: number
  hint: string
  memoryCards: string[]
  rewardLabel: string
  timeLimitSec: number
  correctAnswer?: string
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .trim()
}

export function normalizeAnswer(s: string) {
  return s.replace(/\s+/g, '').toLowerCase()
}

export function checkMemoryAnswer(input: string, ch: DailyChallenge): boolean {
  const tokens = input
    .split(/[,，、\s]+/)
    .map((t) => normalizeAnswer(t))
    .filter(Boolean)
  if (tokens.length === 0) return false

  const fromCards = ch.memoryCards.map((c) => normalizeAnswer(c))
  if (fromCards.length > 0 && tokens.length === fromCards.length) {
    return tokens.every((t, i) => t === fromCards[i])
  }

  const fromHint = (ch.correctAnswer || '')
    .split(/[,，、\s]+/)
    .map((t) => normalizeAnswer(t))
    .filter(Boolean)
  if (fromHint.length > 0 && tokens.length === fromHint.length) {
    return tokens.every((t, i) => t === fromHint[i])
  }

  return false
}

export function checkTextAnswer(input: string, ch: DailyChallenge) {
  const user = normalizeAnswer(input.trim())
  if (!user) return false
  const expected = normalizeAnswer(ch.correctAnswer || '')
  if (expected && user === expected) return true
  if (ch.options.length > 0 && ch.answerIndex >= 0 && ch.answerIndex < ch.options.length) {
    return user === normalizeAnswer(ch.options[ch.answerIndex])
  }
  return false
}

export async function callDailyChallenge(type: string, topic?: string): Promise<DailyChallenge> {
  const res = await fetch('/api/ai/challenges/daily', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, topic: topic?.trim() || undefined }),
  })
  let data: DailyChallenge & { error?: string } = {} as DailyChallenge & { error?: string }
  try {
    data = (await res.json()) as DailyChallenge & { error?: string }
  } catch {
    data = {} as DailyChallenge & { error?: string }
  }
  if (!res.ok) {
    throw new Error(data.error || `요청 실패 (${res.status})`)
  }
  return {
    ...data,
    title: stripMarkdown(data.title || ''),
    instruction: stripMarkdown(data.instruction || ''),
    body: stripMarkdown(data.body || ''),
    hint: stripMarkdown(data.hint || ''),
    options: (data.options || []).map(stripMarkdown),
    memoryCards: (data.memoryCards || []).map(stripMarkdown),
  }
}
