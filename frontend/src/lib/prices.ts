// Prices are in EUR/kWh. `time` and `end` are epoch milliseconds.
export type PricePoint = { time: number; end: number; price: number }

const TZ = 'Europe/Riga'

const dateFmt = new Intl.DateTimeFormat('sv-SE', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
const timeFmt = new Intl.DateTimeFormat('lv-LV', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('lv-LV', { timeZone: TZ, day: '2-digit', month: '2-digit' })

// YYYY-MM-DD in Riga time, so dates compare as strings.
export const rigaDate = (ms: number) => dateFmt.format(ms)
export const formatTime = (ms: number) => timeFmt.format(ms)
export const formatDay = (ms: number) => dayFmt.format(ms)

export function dayLabel(ms: number, now = Date.now()) {
  const day = rigaDate(ms)
  if (day === rigaDate(now)) return 'Šodien'
  if (day === rigaDate(now + 24 * 60 * 60_000)) return 'Rīt'
  return formatDay(ms)
}

export type PriceRange = 'upcoming' | 'month'

export async function fetchPrices(range: PriceRange, signal?: AbortSignal): Promise<PricePoint[]> {
  const res = await fetch(`/api/prices?range=${range}`, { signal })
  if (!res.ok) throw new Error(`Backend responded with ${res.status}`)
  return (await res.json()) as PricePoint[]
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
