import { DataSource, Repository } from 'typeorm';
import { GenderEnum, YNEnum } from '../../../src/common/constant/enum';
import { UserEntity } from '../../../src/entity/user/user.entity';

export const seedUser = async (dataSource: DataSource): Promise<void> => {
  const userRepository: Repository<UserEntity> = dataSource.getRepository(UserEntity);

  const users = [
    {
      userIdx: 1,
      id: 'user1',
      password: 'U2FsdGVkX1/U9O5mXvGpI4io2wis4mFaLG2ShOwXvQI=',
      userName: '관리자',
      userGender: GenderEnum.WOMAN,
      userCell: '010-0000-0000',
      userEmail: 'email@acghr.co.kr',
      userBirth: '1980-01-01',
      userAddress: '서울시 강남구',
      joinDate: '2021-01-01',
      hqIdx: 4,
      teamIdx: 2,
      gradeIdx: 3,
      adminRole: YNEnum.YES,
      comment: null,
      loginToken: null,
      userAvail: null,
    },
    {
      userIdx: 2,
      id: 'user2',
      password: 'U2FsdGVkX1/U9O5mXvGpI4io2wis4mFaLG2ShOwXvQI=',
      userName: '관리자2',
      userGender: GenderEnum.WOMAN,
      userCell: '010-2000-0000',
      userEmail: 'email2@acghr.co.kr',
      userBirth: '1990-01-01',
      userAddress: '서울시 강남구',
      joinDate: '2022-01-01',
      hqIdx: 4,
      teamIdx: 2,
      gradeIdx: 3,
      adminRole: YNEnum.NO,
      comment: null,
      loginToken: null,
      userAvail: null,
    },
  ];

  await userRepository.save(users);

  console.log('🌱 User 테이블 데이터 시딩 성공');
};
