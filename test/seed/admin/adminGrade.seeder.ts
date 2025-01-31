import { DataSource, Repository } from 'typeorm';
import { AdminGradeEnum } from '../../../src/common/constant/enum';
import { AdminGradeEntity } from '../../../src/entity/admin/grade.entity';

export const seedAdminGrade = async (dataSource: DataSource): Promise<void> => {
  const adminGradeRepository: Repository<AdminGradeEntity> = dataSource.getRepository(AdminGradeEntity);

  const adminGrades = [
    {
      adminGradeIdx: 1,
      adminGradeName: AdminGradeEnum.HIGH_ADMIN,
    },
    {
      adminGradeIdx: 2,
      adminGradeName: AdminGradeEnum.NORMAL_ADMIN,
    },
  ];

  await adminGradeRepository.save(adminGrades);

  console.log('🌱 AdminGrade 테이블 데이터 시딩 성공');
};
