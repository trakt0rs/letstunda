import { Controller, DefaultValuePipe, Get, ParseEnumPipe, Query } from '@nestjs/common';
import { PriceRange, PricesService } from './prices.service.js';

const SLOT = 15 * 60_000;

@Controller('api/prices')
export class PricesController {
  constructor(private readonly pricesService: PricesService) { }

  @Get()
  async findPrices(
    @Query('range', new DefaultValuePipe(PriceRange.Upcoming), new ParseEnumPipe(PriceRange)) range: PriceRange,
  ) {
    const prices = await this.pricesService.find(range);
    return prices.map((p) => ({ time: p.time.getTime(), end: p.time.getTime() + SLOT, price: p.price / 1000 }));
  }
}
