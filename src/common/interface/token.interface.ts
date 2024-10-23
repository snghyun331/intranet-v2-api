import { GenderEnum, YNEnum } from '../constant/enum';

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
