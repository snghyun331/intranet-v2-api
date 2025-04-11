import { CurrentUserInfo } from './result.interface';

export interface AllUserInfo extends CurrentUserInfo {
  id: string;
  userAddress: string;
  comment: string;
  userAvalil: Date;
}

export class UserDto {
  userIdx: number;
  userName: string;
}
