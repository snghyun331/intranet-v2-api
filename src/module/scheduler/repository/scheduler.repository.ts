import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from 'src/entity/scheduler/holiday.entity';
import { HolidayInfoDto } from '../dto/holiday.dto';

@Injectable()
export class SchedulerRepository {
  constructor(@InjectRepository(HolidayEntity) private readonly holidayModel: Repository<HolidayEntity>) {}

  async insertHolidayInfo(holidayInfo: HolidayInfoDto) {
    await this.holidayModel.manager.transaction(async (manager) => {
      await manager.createQueryBuilder().insert().into(HolidayEntity).values(holidayInfo).execute();
    });
  }
}
