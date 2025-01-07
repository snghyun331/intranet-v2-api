import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { NoticeInfo } from './notice.interface';

export interface NoticeResult extends TotalPageInfo {
  notices: NoticeInfo[];
}
