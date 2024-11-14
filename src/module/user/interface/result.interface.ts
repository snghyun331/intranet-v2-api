import { GenderEnum, YNEnum } from '../../../common/constant/enum';

export interface UserIdxsResult {
  userIdx: number;
  userName: string;
}

export interface CurrentUserInfoResult {
  userIdx: number;
  userName: string;
  userGender: GenderEnum;
  userCell: string;
  userEmail: string;
  userBirth: string;
  joinDate: string;
  hqName: string;
  teamName: string;
  gradeName: string;
  adminRole: YNEnum;
}

export interface GradeIdxsResult {
  gradeIdx: number;
  gradeName: string;
}
