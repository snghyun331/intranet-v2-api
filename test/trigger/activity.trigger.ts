import { DataSource } from 'typeorm';

export const setupActivityTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`CREATE TRIGGER activity_balance_before_insert
    BEFORE INSERT ON activity_stats 
    FOR EACH ROW 
    BEGIN
	    SET NEW.activity_balance = NEW.activity_budget - NEW.activity_expense;
    END`);

  console.log('🛠️ activity_balance_before_insert 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER activity_balance_before_update
    BEFORE UPDATE ON activity_stats 
    FOR EACH ROW 
    BEGIN
	    SET NEW.activity_balance = NEW.activity_budget - NEW.activity_expense;
    END`);

  console.log('🛠️ activity_balance_before_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER activity_totaloverpay_before_update
    BEFORE UPDATE ON activity_stats 
    FOR EACH ROW 
    BEGIN 
        IF new.activity_balance < 0 THEN
            SET new.total_overpay = ABS(new.activity_balance);
        ELSE
            SET new.total_overpay = 0;
        END IF;
    END`);

  console.log('🛠️ activity_totaloverpay_before_update 트리거 생성 완료');
};
