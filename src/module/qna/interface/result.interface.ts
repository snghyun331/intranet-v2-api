import { TotalPageInfo } from '../../../common/interface/totalPage.interface';
import { QnaInfo } from './qna.interface';

export interface QnaAdminResult extends TotalPageInfo {
  qna: QnaInfo[];
}
