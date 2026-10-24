// Prices are in EUR/MWh. `time` and `end` are epoch milliseconds.
export type PricePoint = { time: number; end: number; price: number }

const TZ = 'Europe/Riga'
const MINUTE = 60_000
const DAY = 24 * 60 * MINUTE

const dateFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', hourCycle: 'h23' })
const timeFmt = new Intl.DateTimeFormat('lv-LV', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('lv-LV', { timeZone: TZ, day: '2-digit', month: '2-digit' })

// YYYY-MM-DD in Riga time, so dates compare as strings.
export const rigaDate = (ms: number) => dateFmt.format(ms)
export const rigaHour = (ms: number) => Number(hourFmt.format(ms))
export const formatTime = (ms: number) => timeFmt.format(ms)
export const formatDay = (ms: number) => dayFmt.format(ms)

// Fetches 15-minute LV prices from `historyDays` days ago up to the latest published
// day (today or tomorrow), from Elering (proxied by Vite, see vite.config.ts).
export async function fetchPrices(historyDays: number, signal?: AbortSignal): Promise<PricePoint[]> {
  const now = Date.now()
  const start = new Date(now - (historyDays + 1) * DAY).toISOString()
  const end = new Date(now + 2 * DAY).toISOString()

  const res = await fetch(`/elering/api/nps/price?start=${start}&end=${end}`, { signal })
  if (!res.ok) throw new Error(`Elering responded with ${res.status}`)
  const body = (await res.json()) as { data: { lv: { timestamp: number; price: number }[] } }

  const firstDay = rigaDate(now - historyDays * DAY)
  const points = body.data.lv
    .map((p) => ({ time: p.timestamp * 1000, end: p.timestamp * 1000 + 15 * MINUTE, price: p.price }))
    .filter((p) => rigaDate(p.time) >= firstDay)

  // Nord Pool's delivery day runs 00:00-24:00 CET, which is 01:00-01:00 in Riga, so the
  // newest prices end with one stray hour of the next Riga day. Drop that partial day.
  if (points.length === 0) return points
  const lastDay = rigaDate(points[points.length - 1].time)
  const lastDaySlots = points.filter((p) => rigaDate(p.time) === lastDay).length
  return lastDaySlots < 92 ? points.filter((p) => rigaDate(p.time) !== lastDay) : points
}

// Averages 15-minute prices into one point per Riga day.
export function dailyAverages(points: PricePoint[]): PricePoint[] {
  const days = new Map<string, { time: number; end: number; sum: number; count: number }>()
  for (const p of points) {
    const key = rigaDate(p.time)
    const day = days.get(key)
    if (day) {
      day.sum += p.price
      day.count++
      day.end = p.end
    } else {
      days.set(key, { time: p.time, end: p.end, sum: p.price, count: 1 })
    }
  }
  return [...days.values()].map((d) => ({ time: d.time, end: d.end, price: d.sum / d.count }))
}
