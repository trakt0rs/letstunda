import { Module } from '@nestjs/common';
import { PricesService } from './prices.service.js';
import { PricesController } from './prices.controller.js';
import { PricesSync } from './prices.sync.js';
import { EleringClient } from './elering.client.js';

@Module({
  controllers: [PricesController],
  providers: [PricesService, PricesSync, EleringClient],
  exports: [PricesService],
})
export class PricesModule {}
