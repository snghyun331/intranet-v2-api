import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { getQueueToken } from '@nestjs/bull';
import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import * as express from 'express';

export const BULL_CONFIG = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => ({
    name: 'queue',
    redis: {
      host: configService.get<string>('REDIS_HOST'),
      port: configService.get<number>('REDIS_PORT'),
    },
  }),
};

export async function setUpBullBoard(app: INestApplication): Promise<void> {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/bull-board');

  const smsQueue = app.get<Queue>(getQueueToken('sms'));

  createBullBoard({
    queues: [new BullAdapter(smsQueue)],
    serverAdapter,
  });

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;

  expressApp.use('/bull-board', serverAdapter.getRouter());
}
