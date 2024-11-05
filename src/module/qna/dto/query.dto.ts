import { ApiProperty, IntersectionType } from '@nestjs/swagger';
import { PageNoDto } from '../../../common/dto/pageNo.dto';
import { YNEnum } from '../../../common/constant/enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QnaFilterDto {
  @ApiProperty({ type: 'enum', enum: YNEnum, description: '답변완료 여부', example: 'N', required: false })
  @IsOptional()
  @IsEnum(YNEnum)
  replySuccessYN?: YNEnum;

  @ApiProperty({ type: String, description: '문의자 핸폰번호', example: '010-4194-5718', required: false })
  @IsOptional()
  @IsString()
  userCell?: string;
}

export class PaginationDto extends IntersectionType(PageNoDto, QnaFilterDto) {}
