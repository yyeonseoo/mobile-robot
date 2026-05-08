import { getVisitorToken } from './storage'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export function authHeaders(): Record<string, string> {
  const t = getVisitorToken()
  return t ? { 'X-Visitor-Token': t } : {}
}

export async function jsonFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, init)
  if (!res.ok) {
    const msg = `${init.method || 'GET'} ${path} failed (${res.status})`
    throw new ApiError(res.status, msg)
  }
  return (await res.json()) as T
}

