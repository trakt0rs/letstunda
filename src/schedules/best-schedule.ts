import { toMinutes } from '../lib/time.js';

const SLOT = 15 * 60_000;

export type Slot = { time: number; price: number };
export type Window = { start: number; end: number };
export type Option = { windows: Window[]; energyKwh: number; avgPrice: number; cost: number };

export type ScheduleDevice = {
  durationMinutes: number;
  powerKw: number;
  splittable: boolean;
  runFrom: string | null;
  runUntil: string | null;
};

export function rankSchedules(
  slots: Slot[],
  device: ScheduleDevice,
  now: number,
  taken: Window[],
  limit: number,
): Option[] {
  if (limit <= 0) return [];
  const needed = Math.ceil(device.durationMinutes / 15);
  const free = slots.filter((s) => s.time >= now && !taken.some((w) => s.time < w.end && s.time + SLOT > w.start));
  const groups =
    device.runFrom && device.runUntil
      ? windowRuns(free, toMinutes(device.runFrom), toMinutes(device.runUntil))
      : device.splittable
        ? byDay(free)
        : [free];

  const choices = device.splittable
    ? groups.filter((g) => g.length >= needed).map((g) => cheapestSlots(g, needed))
    : nonOverlapping(groups.flatMap((g) => blocks(g, needed)), limit);

  return choices
    .map((chosen) => toOption(chosen, device))
    .sort((a, b) => a.cost - b.cost)
    .slice(0, limit);
}

function toOption(chosen: Slot[], device: ScheduleDevice): Option {
  const avgPrice = chosen.reduce((sum, s) => sum + s.price, 0) / chosen.length;
  const energyKwh = (device.powerKw * device.durationMinutes) / 60;
  return { windows: mergeSlots(chosen), energyKwh, avgPrice, cost: avgPrice * energyKwh };
}

function minuteOfDay(ms: number) {
  const date = new Date(ms);
  return date.getHours() * 60 + date.getMinutes();
}

function inWindow(ms: number, from: number, until: number) {
  const m = minuteOfDay(ms);
  return from < until ? m >= from && m < until : m >= from || m < until;
}

function windowRuns(slots: Slot[], from: number, until: number) {
  const runs: Slot[][] = [];
  let run: Slot[] = [];
  for (const slot of slots) {
    const continues = run.length > 0 && run[run.length - 1].time + SLOT === slot.time;
    if (!inWindow(slot.time, from, until) || (run.length > 0 && !continues)) {
      if (run.length > 0) runs.push(run);
      run = [];
    }
    if (inWindow(slot.time, from, until)) run.push(slot);
  }
  if (run.length > 0) runs.push(run);
  return runs;
}

function byDay(slots: Slot[]) {
  const days = new Map<string, Slot[]>();
  for (const slot of slots) {
    const day = new Date(slot.time).toDateString();
    days.set(day, [...(days.get(day) ?? []), slot]);
  }
  return [...days.values()];
}

function cheapestSlots(candidates: Slot[], needed: number) {
  return [...candidates]
    .sort((a, b) => a.price - b.price)
    .slice(0, needed)
    .sort((a, b) => a.time - b.time);
}

function blocks(candidates: Slot[], needed: number) {
  const result: { slots: Slot[]; sum: number }[] = [];
  for (let i = 0; i + needed <= candidates.length; i++) {
    const block = candidates.slice(i, i + needed);
    if (block[needed - 1].time - block[0].time !== (needed - 1) * SLOT) continue;
    result.push({ slots: block, sum: block.reduce((s, p) => s + p.price, 0) });
  }
  return result;
}

function nonOverlapping(candidates: { slots: Slot[]; sum: number }[], limit: number) {
  const picked: Slot[][] = [];
  for (const { slots } of [...candidates].sort((a, b) => a.sum - b.sum)) {
    const start = slots[0].time;
    const end = slots[slots.length - 1].time + SLOT;
    const overlaps = picked.some((p) => start < p[p.length - 1].time + SLOT && end > p[0].time);
    if (!overlaps) picked.push(slots);
    if (picked.length === limit) break;
  }
  return picked;
}

function mergeSlots(slots: Slot[]) {
  const windows: Window[] = [];
  for (const slot of slots) {
    const last = windows[windows.length - 1];
    if (last && last.end === slot.time) last.end = slot.time + SLOT;
    else windows.push({ start: slot.time, end: slot.time + SLOT });
  }
  return windows;
}
