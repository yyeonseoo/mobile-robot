import { authHeaders, jsonFetch } from './api'
import { getVisitorToken } from './storage'

export type VisitorSession = {
  visitorToken: string
  nickname?: string | null
  phoneNumber?: string | null
  quizXp?: number
}

export type QuizChallengeRecord = {
  id: number
  challengeType: string
  title: string | null
  correct: boolean
  xpGained: number
  answeredAt: string
}

export type VisitorProfile = {
  visitorToken: string
  nickname: string | null
  phoneNumber: string | null
  quizXp: number
  photoCount: number
  recentChallenges: QuizChallengeRecord[]
}

export function normalizePhoneInput(raw: string): string {
  return raw.replace(/\D/g, '')
}

export function isValidKoreanMobile(phone: string): boolean {
  return /^01[016789]\d{7,8}$/.test(normalizePhoneInput(phone))
}

export async function createVisitorSession(nickname: string, phoneNumber: string) {
  return jsonFetch<VisitorSession>('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nickname: nickname.trim(), phoneNumber: normalizePhoneInput(phoneNumber) }),
  })
}

export async function fetchVisitorProfile(): Promise<VisitorProfile | null> {
  if (!getVisitorToken()) return null
  return jsonFetch<VisitorProfile>('/api/visitor/me', { headers: authHeaders() })
}

export async function submitQuizResult(body: {
  challengeType: string
  title: string
  correct: boolean
  xpGained: number
}): Promise<number> {
  const res = await jsonFetch<{ quizXp: number }>('/api/visitor/quiz-results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body),
  })
  return res.quizXp
}

export async function syncQuizXpTotal(totalXp: number): Promise<number> {
  const res = await jsonFetch<{ quizXp: number }>('/api/visitor/quiz-xp/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ totalXp }),
  })
  return res.quizXp
}

export async function uploadVisitorPhoto(dataUrl: string, kind = 'strip'): Promise<void> {
  await jsonFetch('/api/visitor/photos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ dataUrl, kind }),
  })
}

export type VisitorPhotoItem = {
  id: number
  kind: string
  imageUrl: string
  createdAt: string
}

export async function listVisitorPhotos(): Promise<VisitorPhotoItem[]> {
  if (!getVisitorToken()) return []
  return jsonFetch<VisitorPhotoItem[]>('/api/visitor/photos', { headers: authHeaders() })
}
