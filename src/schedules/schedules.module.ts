import { Module } from '@nestjs/common';
import { DevicesModule } from '../devices/devices.module.js';
import { PricesModule } from '../prices/prices.module.js';
import { SchedulesController } from './schedules.controller.js';
import { SchedulesService } from './schedules.service.js';

@Module({
  imports: [DevicesModule, PricesModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
