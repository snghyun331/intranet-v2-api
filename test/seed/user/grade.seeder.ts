import { DataSource, Repository } from 'typeorm';
import { GradeEntity } from '../../../src/entity/user/grade.entity';
import { UserGradeEnum } from '../../../src/common/constant/enum';

export const seedUserGrade = async (dataSource: DataSource): Promise<void> => {
  const userGradeRepository: Repository<GradeEntity> = dataSource.getRepository(GradeEntity);

  const userGrades = [
    {
      gradeIdx: 1,
      gradeName: UserGradeEnum.CEO,
    },
    {
      gradeIdx: 2,
      gradeName: UserGradeEnum.DIRECTOR,
    },
    {
      gradeIdx: 3,
      gradeName: UserGradeEnum.MANAGER,
    },
    {
      gradeIdx: 4,
      gradeName: UserGradeEnum.LEADER,
    },
    {
      gradeIdx: 5,
      gradeName: UserGradeEnum.SENIOR,
    },
    {
      gradeIdx: 6,
      gradeName: UserGradeEnum.ADVISOR,
    },
    {
      gradeIdx: 7,
      gradeName: UserGradeEnum.INTERN,
    },
  ];

  await userGradeRepository.save(userGrades);

  console.log('🌱 UserGrade 테이블 데이터 시딩 성공');
};
