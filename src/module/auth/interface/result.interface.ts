import { UserPayload } from '../../../common/interface/token.interface';

export interface LoginUserResult extends UserPayload {
  accessToken: string;
}
