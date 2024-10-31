import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QnaEntity } from '../../entity/qna/qna.entity';
import { QnaService } from './qna.service';
import { QnaRepository } from './repository/qna.repository';
import { QnaController } from './qna.controller';
import { UserEntity } from '../../entity/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([QnaEntity, UserEntity])],
  providers: [QnaService, QnaRepository],
  controllers: [QnaController],
})
export class QnaModule {}
