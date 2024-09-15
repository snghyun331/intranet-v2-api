import { PickType } from '@nestjs/swagger';
import { HolidayEntity } from 'src/entity/scheduler/holiday.entity';

export class HolidayInfoDto extends PickType(HolidayEntity, ['holidayName', 'holidayDate'] as const) {}
