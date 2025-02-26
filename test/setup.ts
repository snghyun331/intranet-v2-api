import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.test' }); // .env.test 파일 강제 로드

import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DATABASE_CONFIG, TEST_DATABASE_CONFIG } from '../src/config/database.config';
import { seedUser } from './seed/user/user.seeder';
import { seedUserGrade } from './seed/user/grade.seeder';
import { seedAdmin } from './seed/admin/admin.seeder';
import { seedAdminGrade } from './seed/admin/adminGrade.seeder';
import { seedTeam } from './seed/user/team.seeder';
import { seedHeadquarter } from './seed/user/headquarter.seeder';
import { setupMealTriggers } from './trigger/meal.trigger';
import { setupWelfareTriggers } from './trigger/werlfare.trigger';
import { setupActivityTriggers } from './trigger/activity.trigger';

let dataSource: DataSource;

beforeAll(async () => {
  // TypeORM 초기화
  const configService = new ConfigService();
  const typeOrmModuleOptions = await TEST_DATABASE_CONFIG.useFactory(configService);

  dataSource = new DataSource(typeOrmModuleOptions as DataSourceOptions);

  await dataSource.initialize();

  console.log('✅ 테스트 컨테이너 TypeORM 초기화 성공');

  // 데이터 시딩
  await seedTeam(dataSource);
  await seedHeadquarter(dataSource);
  await seedUserGrade(dataSource);
  await seedUser(dataSource);
  await seedAdminGrade(dataSource);
  await seedAdmin(dataSource);

  // 트리거 설정
  await setupMealTriggers(dataSource);
  await setupWelfareTriggers(dataSource);
  await setupActivityTriggers(dataSource);
});

afterAll(async () => {
  // TypeORM 연결 종료
  if (dataSource) {
    await dataSource.destroy();
  }
});
