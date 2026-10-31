import type { Device } from './devices'
import { rigaHour, type PricePoint } from './prices'

const SLOT = 15 * 60_000

export type TimeWindow = { start: number; end: number }

export type Schedule = {
  windows: TimeWindow[]
  energyKwh: number
  // Exchange price only, EUR.
  cost: number
}

// Cheapest time to run a device, from the next 15-minute slot onwards.
// Returns null if there aren't enough published prices to fit the run.
export function bestSchedule(prices: PricePoint[], device: Device, now: number): Schedule | null {
  const needed = Math.ceil(device.durationMinutes / 15)
  const upcoming = prices.filter((p) => p.time >= now)

  // Without a run window, any known slot will do.
  const candidates = device.runFrom && device.runUntil
    ? firstFittingWindow(upcoming, device.runFrom, device.runUntil, needed)
    : upcoming
  if (candidates.length < needed) return null

  const slots = device.splittable ? cheapestSlots(candidates, needed) : cheapestBlock(candidates, needed)
  if (!slots) return null

  const priceSum = slots.reduce((sum, p) => sum + p.price, 0)
  return {
    windows: mergeSlots(slots),
    energyKwh: (device.powerKw * device.durationMinutes) / 60,
    cost: (priceSum / 1000) * device.powerKw * (SLOT / 3_600_000),
  }
}

const DAY_MINUTES = 24 * 60

// "HH:MM" → minutes since midnight.
export function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Length of a run window in minutes. It may cross midnight (22:00–07:00); equal ends mean a whole day.
export function runWindowMinutes(from: string, until: string) {
  return (toMinutes(until) - toMinutes(from) + DAY_MINUTES) % DAY_MINUTES || DAY_MINUTES
}

// Riga time of day in minutes (Riga's UTC offset is whole hours, so UTC minutes match).
const rigaMinutes = (ms: number) => rigaHour(ms) * 60 + new Date(ms).getUTCMinutes()

function inRunWindow(ms: number, from: number, until: number) {
  const m = rigaMinutes(ms)
  return from < until ? m >= from && m < until : m >= from || m < until
}

// Slots of the next run window (e.g. tonight 22:00–07:00) that still has room for the whole cycle.
function firstFittingWindow(upcoming: PricePoint[], from: string, until: string, needed: number) {
  const f = toMinutes(from)
  const u = toMinutes(until)
  let run: PricePoint[] = []
  for (const p of upcoming) {
    const continues = run.length > 0 && run[run.length - 1].end === p.time
    if (!inRunWindow(p.time, f, u) || (run.length > 0 && !continues)) {
      if (run.length >= needed) return run
      run = []
    }
    if (inRunWindow(p.time, f, u)) run.push(p)
  }
  return run
}

// Any `needed` slots, cheapest first, back in time order.
function cheapestSlots(candidates: PricePoint[], needed: number) {
  return [...candidates]
    .sort((a, b) => a.price - b.price)
    .slice(0, needed)
    .sort((a, b) => a.time - b.time)
}

// The cheapest run of `needed` back-to-back slots.
function cheapestBlock(candidates: PricePoint[], needed: number) {
  let best: PricePoint[] | null = null
  let bestSum = Infinity
  for (let i = 0; i + needed <= candidates.length; i++) {
    const block = candidates.slice(i, i + needed)
    if (block[needed - 1].time - block[0].time !== (needed - 1) * SLOT) continue
    const sum = block.reduce((s, p) => s + p.price, 0)
    if (sum < bestSum) {
      best = block
      bestSum = sum
    }
  }
  return best
}

// Joins back-to-back slots into time windows.
function mergeSlots(slots: PricePoint[]): TimeWindow[] {
  const windows: TimeWindow[] = []
  for (const slot of slots) {
    const last = windows[windows.length - 1]
    if (last && last.end === slot.time) last.end = slot.end
    else windows.push({ start: slot.time, end: slot.end })
  }
  return windows
}
