import 'dotenv/config';
import { prisma } from '../lib/prisma.js';
import { EleringClient } from '../prices/elering.client.js';
import { PricesService } from '../prices/prices.service.js';

const DAY = 24 * 60 * 60_000;

const days = Number(process.argv[2] ?? 31);
const now = Date.now();
const slots = await new EleringClient().fetchPrices(new Date(now - days * DAY), new Date(now));
const count = await new PricesService().save(slots);
console.log(`Stored ${count} prices from the last ${days} days`);
await prisma.$disconnect();
