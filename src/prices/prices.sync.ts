import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EleringClient } from './elering.client.js';
import { PricesService, type PriceSlot } from './prices.service.js';

const DAY = 24 * 60 * 60_000;
const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 2_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class PricesSync implements OnApplicationBootstrap {
  private readonly logger = new Logger(PricesSync.name);
  private running = false;

  constructor(
    private readonly elering: EleringClient,
    private readonly prices: PricesService,
  ) { }

  onApplicationBootstrap() {
    void this.sync();
  }

  @Cron('*/5 * * * *')
  async sync() {
    if (this.running) return;
    this.running = true;
    try {
      const slots = await this.fetch();
      const count = await this.prices.save(slots);
      this.logger.log(`Stored ${count} prices`);
    } catch (err) {
      this.logger.error('Price sync failed', err);
    } finally {
      this.running = false;
    }
  }

  private async fetch(): Promise<PriceSlot[]> {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(Date.now() + 2 * DAY);

    for (let attempt = 1; ; attempt++) {
      try {
        return await this.elering.fetchPrices(start, end);
      } catch (err) {
        if (attempt >= MAX_ATTEMPTS) throw err;
        const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
        this.logger.warn(`Elering fetch attempt ${attempt} failed, retrying in ${delay}ms: ${err}`);
        await sleep(delay);
      }
    }
  }
}
