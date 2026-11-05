import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import { auth } from '../lib/auth.js';
import { SchedulesService } from './schedules.service.js';

@Controller('api/schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) { }

  @Get()
  async findAll(@Req() req: Request) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();
    return this.schedulesService.findAll(session.user.id);
  }
}
