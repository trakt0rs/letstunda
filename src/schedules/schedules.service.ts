import { Injectable } from '@nestjs/common';
import { DevicesService } from '../devices/devices.service.js';
import { prisma } from '../lib/prisma.js';
import { PriceRange, PricesService } from '../prices/prices.service.js';
import { rankSchedules, type Option, type Slot } from './best-schedule.js';

const MAX_OPTIONS = 5;

type Rating = 'cheap' | 'normal' | 'expensive';
type RatedOption = Option & { rating: Rating | null };

function toSlots(prices: { time: Date; price: number }[]): Slot[] {
  return prices.map((p) => ({ time: p.time.getTime(), price: p.price / 1000 }));
}

function percentile(sorted: number[], p: number) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
}

function rate(avgPrice: number, history: number[]): Rating | null {
  if (history.length === 0) return null;
  if (avgPrice < percentile(history, 0.5)) return 'cheap';
  if (avgPrice <= percentile(history, 0.75)) return 'normal';
  return 'expensive';
}

function isRunning(option: Option, now: number) {
  return option.windows[0].start <= now && now < option.windows[option.windows.length - 1].end;
}

@Injectable()
export class SchedulesService {
  constructor(
    private readonly devices: DevicesService,
    private readonly prices: PricesService,
  ) { }

  async findAll(userId: string) {
    const [devices, upcoming, month] = await Promise.all([
      this.devices.findAll(userId),
      this.prices.find(PriceRange.Upcoming),
      this.prices.find(PriceRange.Month),
    ]);
    const stored = await prisma.schedule.findMany({ where: { deviceId: { in: devices.map((d) => d.id) } } });
    const slots = toSlots(upcoming);
    const history = toSlots(month).map((s) => s.price).sort((a, b) => a - b);
    const now = Date.now();

    const schedules = devices.map((device) => {
      const previous = (stored.find((s) => s.deviceId === device.id)?.options ?? []) as RatedOption[];
      const running = previous.filter((o) => isRunning(o, now));
      const upcomingOptions = rankSchedules(
        slots,
        device,
        now,
        running.flatMap((o) => o.windows),
        MAX_OPTIONS - running.length,
      ).map((o) => ({ ...o, rating: rate(o.avgPrice, history) }));
      return { deviceId: device.id, options: [...running, ...upcomingOptions] };
    });

    await prisma.$transaction(
      schedules.map(({ deviceId, options }) =>
        prisma.schedule.upsert({
          where: { deviceId },
          create: { deviceId, options },
          update: { options },
        }),
      ),
    );
    return schedules;
  }
}
