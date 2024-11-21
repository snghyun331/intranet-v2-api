import { AdminGradeEnum } from '../../../common/constant/enum';

export interface Admin {
  adminIdx: number;
  id: string;
  password: string;
  adminName: string;
  adminEmail: string;
  adminGradeName: AdminGradeEnum;
}
