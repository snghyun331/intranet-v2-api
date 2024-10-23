import { GenderEnum, YNEnum } from '../../../common/constant/enum';

export interface User {
  id: string;
  password: string;
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
