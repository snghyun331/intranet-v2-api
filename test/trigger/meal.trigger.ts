import { DataSource } from 'typeorm';

export const setupMealTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`DROP TRIGGER IF EXISTS meal_totaloverpay_before_update`);

  await dataSource.query(`CREATE TRIGGER meal_totaloverpay_before_update
    BEFORE UPDATE ON meal_stats
    FOR EACH ROW
    BEGIN
      DECLARE meal_balance DECIMAL(10,0);
      SET meal_balance = NEW.meal_budget - NEW.meal_expense;

      IF meal_balance < 0 THEN
        SET NEW.total_overpay = NEW.breakfast_overpay + NEW.dinner_overpay + ABS(meal_balance);
      ELSE
        SET NEW.total_overpay = NEW.breakfast_overpay + NEW.dinner_overpay;
      END IF;
    END`);

  console.log('🛠️ meal_totaloverpay_before_update 트리거 생성 완료');
};
