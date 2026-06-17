import { authHeaders, jsonFetch } from './api'
import { getVisitorToken } from './storage'

const EVENT_ACTIONS_KEY = 'stampRallyEventActions'

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
  eventActions: VisitorEventAction[]
}

export type VisitorEventAction = {
  id: number
  eventId: string
  actionType: string
  createdAt: string
}

function loadLocalEventActions(): VisitorEventAction[] {
  try {
    const raw = localStorage.getItem(EVENT_ACTIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as VisitorEventAction[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveLocalEventActions(actions: VisitorEventAction[]) {
  localStorage.setItem(EVENT_ACTIONS_KEY, JSON.stringify(actions))
}

function mergeEventActions(
  serverActions: VisitorEventAction[] | undefined,
  localActions: VisitorEventAction[]
): VisitorEventAction[] {
  const map = new Map<string, VisitorEventAction>()
  for (const action of serverActions || []) {
    map.set(`${action.eventId}:${action.actionType}`, action)
  }
  for (const action of localActions) {
    map.set(`${action.eventId}:${action.actionType}`, action)
  }
  return Array.from(map.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
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
  const profile = await jsonFetch<Omit<VisitorProfile, 'eventActions'> & { eventActions?: VisitorEventAction[] }>(
    '/api/visitor/me',
    { headers: authHeaders() }
  )
  return {
    ...profile,
    eventActions: mergeEventActions(profile.eventActions, loadLocalEventActions()),
  }
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

export async function recordVisitorEventAction(
  eventId: string,
  actionType = 'join'
): Promise<VisitorEventAction> {
  const existing = loadLocalEventActions().find(
    (a) => a.eventId === eventId && a.actionType === actionType
  )
  if (existing) return existing

  const action: VisitorEventAction = {
    id: Date.now(),
    eventId,
    actionType,
    createdAt: new Date().toISOString(),
  }
  saveLocalEventActions([action, ...loadLocalEventActions()])
  return action
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
