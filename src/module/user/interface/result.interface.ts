import { GenderEnum, IntranetLeaveTypeIdxEnum, YNEnum } from '../../../common/constant/enum';
import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { AllUserInfo } from './user.interface';

export interface UserIdxsResult {
  userIdx: number;
  userName: string;
  gradeIdx: number;
}

export interface CurrentUserInfo {
  userIdx: number;
  userName: string;
  userGender: GenderEnum;
  userCell: string;
  userEmail: string;
  userBirth: string;
  userAddress: string;
  joinDate: string;
  hqName: string;
  teamName: string;
  gradeName: string;
  adminRole: YNEnum;
}

export interface CurrentUserInfoResult extends CurrentUserInfo {
  checkInTime: Date;
  attendance: IntranetLeaveTypeIdxEnum;
  workingMinutes: number;
}

export interface GradeIdxsResult {
  gradeIdx: number;
  gradeName: string;
}

export interface AllUserInfoResult extends TotalPageInfo {
  users: AllUserInfo[];
}

export interface HqIdxsResult {
  hqIdx: number;
  hqName: string;
}

export interface TeamIdxsResult {
  teamIdx: number;
  teamName: string;
}
