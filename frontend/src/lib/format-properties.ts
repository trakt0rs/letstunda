import { formatTime, rigaDate } from './prices'
import type { TimeWindow } from './schedule'

export function windowLabel(w: TimeWindow, now: number) {
  const day = rigaDate(w.start) === rigaDate(now) ? 'Šodien' : 'Rīt'
  return `${day} ${formatTime(w.start)}–${formatTime(w.end)}`
}

export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export const formatKwh = (kwh: number) => String(Number(kwh.toFixed(1)))
