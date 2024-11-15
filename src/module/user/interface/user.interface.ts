import { CurrentUserInfoResult } from './result.interface';

export interface AllUserInfo extends CurrentUserInfoResult {
  id: string;
  userAddress: string;
  comment: string;
  userAvalil: Date;
}
