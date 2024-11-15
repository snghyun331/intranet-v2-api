import { CurrentUserInfoResult } from './result.interface';

export interface AllUserInfo extends CurrentUserInfoResult {
  userAddress: string;
  comment: string;
  userAvalil: Date;
}
