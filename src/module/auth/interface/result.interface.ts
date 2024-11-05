import { UserPayload } from '../../../common/interface/payload.interface';

export interface LoginUserResult extends UserPayload {
  accessToken: string;
}
