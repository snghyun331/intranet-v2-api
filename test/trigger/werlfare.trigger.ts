import { DataSource } from 'typeorm';

export const setupWelfareTriggers = async (dataSource: DataSource): Promise<void> => {
  await dataSource.query(`CREATE TRIGGER welfare_expense_after_update
    AFTER UPDATE ON welfare_monthly_stats 
    FOR EACH ROW 
    BEGIN
        DECLARE currentMonth INT;
        DECLARE currentYear INT;

        SET currentMonth = MONTH(CURDATE());
        SET currentYear = YEAR(CURDATE());

        IF currentMonth >= 7 THEN
            UPDATE welfare_stats ws
            SET welfare_expense = (
                SELECT SUM(welfare_month_expense)
                FROM welfare_monthly_stats wms
                WHERE wms.month in ('7','8','9','10','11','12')
                    AND wms.year = currentYear
                    AND wms.user_idx = ws.user_idx
        )
        WHERE half_year = 'H2';

        ELSE
            UPDATE welfare_stats ws
            SET welfare_expense = (
                SELECT SUM(welfare_month_expense)
                FROM welfare_monthly_stats wms
                WHERE wms.month in ('1','2','3','4','5','6')
                    AND wms.year = currentYear
                    AND wms.user_idx = ws.user_idx
            )
            WHERE half_year = 'H1';
        END IF;
    END`);

  console.log('🛠️ welfare_expense_after_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER welfare_balance_before_insert
    BEFORE INSERT ON welfare_stats 
    FOR EACH ROW 
    BEGIN
	    SET NEW.welfare_balance = NEW.welfare_budget - NEW.welfare_expense;
    END`);

  console.log('🛠️ welfare_balance_before_insert 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER welfare_balance_before_update
    BEFORE UPDATE ON welfare_stats 
    FOR EACH ROW 
    BEGIN
	    SET NEW.welfare_balance = NEW.welfare_budget - NEW.welfare_expense;
    END`);

  console.log('🛠️ welfare_balance_before_update 트리거 생성 완료');

  await dataSource.query(`CREATE TRIGGER welfare_totaloverpay_before_update
    BEFORE UPDATE ON welfare_stats 
    FOR EACH ROW 
    BEGIN 
	    IF new.welfare_balance < 0 THEN
            SET new.total_overpay = ABS(new.welfare_balance);
        ELSE
            SET new.total_overpay = 0;
        END IF;
    END`);

  console.log('🛠️ welfare_totaloverpay_before_update 트리거 생성 완료');
};
