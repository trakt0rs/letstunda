import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from "../lib/prisma.js";
import type { CreateDeviceDto } from "./add-device.dto.js"
import { intervalMinutes } from '../lib/time.js';

@Injectable()
export class DevicesService {

  findAll(userId: string) {
    return prisma.device.findMany({
      where: { userId },
    });
  }
  addDevice(userId: string, body: CreateDeviceDto) {
    if (!body.name?.trim()) throw new BadRequestException("Name required")
    if (!(body.powerKw > 0)) throw new BadRequestException("Invalid power")
    if (!(body.durationMinutes > 0)) throw new BadRequestException("Invalid cycle")
    if (!body.runFrom !== !body.runUntil) throw new BadRequestException("Both times required")
    if (body.runFrom && body.runUntil &&
        body.durationMinutes > intervalMinutes(body.runFrom, body.runUntil))
      throw new BadRequestException("Cycle doesn't fit the time window")

    return prisma.device.create({
      data: {
        name: body.name,
        image: body.image,
        durationMinutes: body.durationMinutes,
        powerKw: body.powerKw,
        splittable: body.splittable,
        runFrom: body.runFrom,
        runUntil: body.runUntil,
        userId,
      },
    });
  }
  deleteDevice(userId: string, id: string) {
    return prisma.device.delete({
      where: { id, userId },
    });
  }
}
