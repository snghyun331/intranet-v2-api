import { DataSource } from 'typeorm';

export const setupActivityTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`DROP TRIGGER IF EXISTS activity_totaloverpay_before_update`);

  await dataSource.query(`CREATE TRIGGER activity_totaloverpay_before_update
    BEFORE UPDATE ON activity_stats 
    FOR EACH ROW 
    BEGIN 
      DECLARE activity_balance DECIMAL(10,0);
      SET activity_balance = NEW.activity_budget - NEW.activity_expense;

      IF activity_balance < 0 THEN
          SET new.total_overpay = ABS(activity_balance);
      ELSE
          SET new.total_overpay = 0;
      END IF;
      
    END`);

  console.log('🛠️ activity_totaloverpay_before_update 트리거 생성 완료');
};
