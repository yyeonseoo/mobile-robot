const TOKEN_KEY = 'stampRallyVisitorToken'
const NICK_KEY = 'stampRallyNickname'
const PHONE_KEY = 'stampRallyPhone'

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

export function getPhone(): string {
  return localStorage.getItem(PHONE_KEY) || ''
}

export function setPhone(phone: string) {
  if (!phone) localStorage.removeItem(PHONE_KEY)
  else localStorage.setItem(PHONE_KEY, phone)
}

export function clearPhone() {
  localStorage.removeItem(PHONE_KEY)
}

export function clearVisitorSession() {
  clearVisitorToken()
  clearNickname()
  clearPhone()
  localStorage.removeItem('stampRallyEventActions')
}

