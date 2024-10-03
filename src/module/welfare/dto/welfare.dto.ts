import { PickType } from '@nestjs/swagger';
import { WelfareEntity } from '../../../entity/welfare/welfare.entity';

export class WelfareInfoDto extends PickType(WelfareEntity, ['welfareIdx', 'userIdx', 'useDate'] as const) {}
