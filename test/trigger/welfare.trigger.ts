import { DataSource } from 'typeorm';

export const setupWelfareTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`DROP TRIGGER IF EXISTS welfare_totaloverpay_before_update`);

  await dataSource.query(`CREATE TRIGGER welfare_totaloverpay_before_update
    BEFORE UPDATE ON welfare_stats 
    FOR EACH ROW 
    BEGIN 
      DECLARE welfare_balance DECIMAL(10,0);
      SET welfare_balance = NEW.welfare_budget - NEW.welfare_expense;

      IF welfare_balance < 0 THEN
          SET new.total_overpay = ABS(welfare_balance);
      ELSE
          SET new.total_overpay = 0;
      END IF;
    
    END`);

  console.log('🛠️ welfare_totaloverpay_before_update 트리거 생성 완료');
};
