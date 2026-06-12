export type StampMapMarker = {
  code: string
  label: string
  name: string
  left: number
  top: number
}

/** 랠리 지도 이미지 기준 퍼센트 좌표 (feat/temi-stamp-photo-final과 동일) */
export const STAMP_MAP_MARKERS: StampMapMarker[] = [
  { code: 'RALLY-1', label: 'A', name: 'A 구역', left: 30, top: 62 },
  { code: 'RALLY-2', label: 'B', name: 'B 구역', left: 62, top: 60 },
  { code: 'RALLY-3', label: 'C', name: 'C 구역', left: 38, top: 36 },
  { code: 'RALLY-4', label: 'D', name: 'D 구역', left: 73, top: 33 },
]

export function isStampCollected(stamps: { spotCode: string }[], code: string): boolean {
  return stamps.some((s) => s.spotCode === code)
}
