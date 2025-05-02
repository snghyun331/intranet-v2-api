import { DataSource, Repository } from 'typeorm';
import { AdminEntity } from '../../../src/entity/admin/admin.entity';

export const seedAdmin = async (dataSource: DataSource): Promise<void> => {
  const adminRepository: Repository<AdminEntity> = dataSource.getRepository(AdminEntity);

  const admins = [
    {
      adminIdx: 1,
      userIdx: 1,
      id: 'shlee1',
      password: 'U2FsdGVkX1/U9O5mXvGpI4io2wis4mFaLG2ShOwXvQI=',
      adminName: '관리자',
      adminEmail: 'email@acghr.co.kr',
      adminGradeIdx: 1,
      loginToken: null,
    },
  ];

  await adminRepository.save(admins);

  console.log('🌱 Admin 테이블 데이터 시딩 성공');
};
