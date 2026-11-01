import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule, ObserveInstrument } from './app.module.js';
import { auth } from './lib/auth.js';

process.env.TZ = 'Europe/Riga';

async function bootstrap() {
  // Better Auth reads the raw request body, so its routes are mounted before
  // the JSON body parser.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    instrument: ObserveInstrument,
    bodyParser: false,
  });
  app.getHttpAdapter().getInstance().all('/api/auth/*splat', toNodeHandler(auth));
  app.useBodyParser('json');
  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
