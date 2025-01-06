import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { NoticeInfo } from './notice.interface';

export interface NoticeAdminResult extends TotalPageInfo {
  notices: NoticeInfo[];
}
