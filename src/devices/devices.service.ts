import { Injectable } from '@nestjs/common';
import { prisma } from "../lib/prisma.js";
import type { CreateDeviceDto } from "./add-device.dto.js"

@Injectable()
export class DevicesService {

  findAll(userId: string) {
    return prisma.device.findMany({
      where: { userId },
    });
  }
  addDevice(userId: string, body: CreateDeviceDto) {
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
}
