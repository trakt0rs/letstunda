import type { Device } from './devices'
import { formatTime, type PricePoint } from './prices'

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

  // The first deadline that still leaves room for the whole run; without one, use every known slot.
  const deadlineIndex = device.deadline
    ? upcoming.findIndex((p, i) => i >= needed && formatTime(p.time) === device.deadline)
    : -1
  const candidates = deadlineIndex === -1 ? upcoming : upcoming.slice(0, deadlineIndex)
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
