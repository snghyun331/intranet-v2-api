import { DataSource } from 'typeorm';

export const setupMealTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`CREATE TRIGGER meal_totaloverpay_before_update
    BEFORE UPDATE ON meal_stats
    FOR EACH ROW
    BEGIN
      IF NEW.meal_balance < 0 THEN
        SET NEW.total_overpay = NEW.breakfast_overpay + NEW.dinner_overpay + ABS(NEW.meal_balance);
      ELSE
        SET NEW.total_overpay = NEW.breakfast_overpay + NEW.dinner_overpay;
      END IF;
    END`);

  console.log('🛠️ meal_totaloverpay_before_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER meal_balance_before_insert
    BEFORE INSERT ON meal_stats 
    FOR EACH ROW 
    BEGIN
	    SET NEW.meal_balance = NEW.meal_budget - NEW.meal_expense;
    END`);

  console.log('🛠️ meal_balance_before_insert 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER meal_balance_before_update
    BEFORE UPDATE ON meal_stats 
    FOR EACH ROW 
    BEGIN 
	    SET NEW.meal_balance = NEW.meal_budget - NEW.meal_expense;
    END`);

  console.log('🛠️ meal_balance_before_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER meal_budget_before_update
    BEFORE UPDATE ON meal_stats 
    FOR EACH ROW 
    BEGIN 
	    SET new.meal_budget = (new.workdays + new.holiday_workdays - new.time_off_days) * (select base_amount from meal_base mb where mb.year = NEW.year and mb.month = new.month);
    END`);

  console.log('🛠️ meal_budget_before_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER meal_base_after_update
    AFTER UPDATE ON meal_base 
    FOR EACH row
    BEGIN 
	    UPDATE meal_stats ms
        SET meal_budget = (workdays + holiday_workdays - time_off_days) * (select base_amount from meal_base mb where mb.year = NEW.year and mb.month = new.month)
        WHERE ms.year = NEW.year AND ms.month = NEW.month;
    END`);

  console.log('🛠️ meal_base_after_update 트리거 생성 완료');
};
