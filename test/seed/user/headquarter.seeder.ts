import { DataSource } from 'typeorm';
import { HeadquarterEntity } from '../../../src/entity/user/headquarter.entity';

export const seedHeadquarter = async (dataSource: DataSource): Promise<void> => {
  const headquarterRepository = dataSource.getRepository(HeadquarterEntity);

  const headquarters = [
    {
      hqIdx: 1,
      hqName: '경영진',
      hqAvail: null,
    },
    {
      hqIdx: 2,
      hqName: 'P&C',
      hqAvail: null,
    },
    {
      hqIdx: 3,
      hqName: 'Assessment1',
      hqAvail: null,
    },
    {
      hqIdx: 4,
      hqName: 'Assessment2',
      hqAvail: null,
    },
    {
      hqIdx: 5,
      hqName: 'Assessment3',
      hqAvail: null,
    },
    {
      hqIdx: 6,
      hqName: 'HR 컨설팅',
      hqAvail: null,
    },
    {
      hqIdx: 7,
      hqName: 'HR 운영',
      hqAvail: null,
    },
    {
      hqIdx: 8,
      hqName: 'HR Tech',
      hqAvail: null,
    },
    {
      hqIdx: 9,
      hqName: 'PA',
      hqAvail: null,
    },
    {
      hqIdx: 10,
      hqName: '면접/교육 운영',
      hqAvail: null,
    },
    {
      hqIdx: 11,
      hqName: '-',
      hqAvail: null,
    },
  ];

  await headquarterRepository.save(headquarters);

  console.log('🌱 Headquarter 테이블 데이터 시딩 성공');
};
