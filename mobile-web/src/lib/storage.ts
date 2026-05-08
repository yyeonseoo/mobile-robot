const TOKEN_KEY = 'stampRallyVisitorToken'
const NICK_KEY = 'stampRallyNickname'

export function getVisitorToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setVisitorToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearVisitorToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function getNickname(): string {
  return localStorage.getItem(NICK_KEY) || ''
}

export function setNickname(nick: string) {
  if (!nick) localStorage.removeItem(NICK_KEY)
  else localStorage.setItem(NICK_KEY, nick)
}

export function clearNickname() {
  localStorage.removeItem(NICK_KEY)
}

