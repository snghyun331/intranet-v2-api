import { AdminGradeEnum, GenderEnum, YNEnum } from '../constant/enum';

export interface UserPayload {
  userIdx: number;
  userName: string;
  userGender: GenderEnum;
  userBirth: string;
  joinDate: string;
  hqName: string;
  teamName: string;
  gradeName: string;
  adminRole: YNEnum;
}

export interface AdminPayload {
  adminIdx: number;
  adminName: string;
  adminEmail: string;
  adminGradeName: AdminGradeEnum;
}
