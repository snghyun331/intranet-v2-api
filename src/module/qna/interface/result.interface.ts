import { QnaCategoryEnum, YNEnum } from '../../../common/constant/enum';

export interface QnaInfo {
  qnaIdx: number;
  userIdx: number;
  userName: string;
  userCell: string;
  category: QnaCategoryEnum;
  text: string;
  replySuccessYN: YNEnum;
  replyText: string;
  replyAdmin: string;
  createdAt: Date;
}

interface TotalQnaInfo {
  totalPage: number;
  total: number;
}

export interface QnaAdminResult extends TotalQnaInfo {
  qna: QnaInfo[];
}
