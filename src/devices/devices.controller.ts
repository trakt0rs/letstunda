import { Controller, Get, Req, Post, Body, Delete, Param, UnauthorizedException } from '@nestjs/common';
import { auth } from "../lib/auth.js";
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from "express";
import { DevicesService } from "./devices.service.js";
import type { CreateDeviceDto } from "./add-device.dto.js"

@Controller('api/devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) { }

  @Get()
  async findAll(@Req() req: Request) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();
    return this.devicesService.findAll(session.user.id);
  }

  @Post()
  async addDevice(@Req() req: Request, @Body() body: CreateDeviceDto) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();
    return this.devicesService.addDevice(session.user.id, body);
  }

  @Delete(':id')
  async deleteDevice(@Req() req: Request, @Param('id') id: string) {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new UnauthorizedException();
    return this.devicesService.deleteDevice(session.user.id, id);
  }
}
