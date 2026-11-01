import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { prisma } from '../lib/prisma.js';

export type PriceSlot = { time: Date; price: number };

export enum PriceRange {
  Upcoming = 'upcoming',
  Month = 'month',
}

const RANGE_DAYS: Record<PriceRange, [number, number]> = {
  [PriceRange.Upcoming]: [0, 2],
  [PriceRange.Month]: [-30, 1],
};

function midnight(addDays: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + addDays);
  return date;
}

@Injectable()
export class PricesService {
  find(range: PriceRange) {
    const [from, to] = RANGE_DAYS[range];
    return prisma.price.findMany({
      where: { time: { gte: midnight(from), lt: midnight(to) } },
      orderBy: { time: 'asc' },
    });
  }

  async save(slots: PriceSlot[]) {
    if (slots.length === 0) return 0;
    const now = new Date();
    return prisma.$executeRaw`
      INSERT INTO "prices" ("time", "price", "updatedAt")
      VALUES ${Prisma.join(slots.map((s) => Prisma.sql`(${s.time}, ${s.price}, ${now})`))}
      ON CONFLICT ("time") DO UPDATE SET "price" = EXCLUDED."price", "updatedAt" = EXCLUDED."updatedAt"
    `;
  }
}
