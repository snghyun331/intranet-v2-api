import { AdminPayload, UserPayload } from '@common/interface/payload.interface';

export interface LoginUserResult extends UserPayload {
  accessToken: string;
}

export interface LoginAdminResult extends AdminPayload {
  accessToken: string;
}
