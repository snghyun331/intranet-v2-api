import { Module } from '@nestjs/common';
import { CommuteModule } from './commute/commute.module';

@Module({
  imports: [CommuteModule],
})
export class IntranetModule {}
