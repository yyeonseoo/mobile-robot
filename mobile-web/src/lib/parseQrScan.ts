/** QR/바코드 스캔 결과에서 스탬프 claim 코드 또는 앱 경로 추출 */
export function extractClaimCode(raw: string): string | null {
  const text = raw.trim()
  if (!text) return null

  try {
    const url = new URL(text.includes('://') ? text : `https://${text}`)
    const claim = url.searchParams.get('claim')
    if (claim?.trim()) return claim.trim()
  } catch {
    // plain code
  }

  if (/^RALLY-\d+$/i.test(text)) return text.toUpperCase()
  return text
}
