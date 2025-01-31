import { DataSource } from 'typeorm';
import { TeamEntity } from '../../../src/entity/user/team.entity';

export const seedTeam = async (dataSource: DataSource): Promise<void> => {
  const teamRepository = dataSource.getRepository(TeamEntity);

  const teams = [
    {
      teamIdx: 1,
      teamName: '경영진',
      teamAvail: null,
    },
    {
      teamIdx: 2,
      teamName: 'P&C',
      teamAvail: null,
    },
    {
      teamIdx: 3,
      teamName: 'Assessment1',
      teamAvail: null,
    },
    {
      teamIdx: 4,
      teamName: 'Assessment2',
      teamAvail: null,
    },
    {
      teamIdx: 5,
      teamName: 'Assessment3',
      teamAvail: null,
    },
    {
      teamIdx: 6,
      teamName: 'HR 컨설팅',
      teamAvail: null,
    },
    {
      teamIdx: 7,
      teamName: 'HR 운영',
      teamAvail: null,
    },
    {
      teamIdx: 8,
      teamName: 'HR Tech',
      teamAvail: null,
    },
    {
      teamIdx: 9,
      teamName: 'PA',
      teamAvail: null,
    },
    {
      teamIdx: 10,
      teamName: '면접/교육 운영',
      teamAvail: null,
    },
    {
      teamIdx: 11,
      teamName: '-',
      teamAvail: null,
    },
  ];

  await teamRepository.save(teams);

  console.log('🌱 Team 테이블 데이터 시딩 성공');
};
