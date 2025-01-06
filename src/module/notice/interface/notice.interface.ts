export interface NoticeInfo {
  noticeIdx: number;
  title: string;
  creatorName: string;
  createdAt: Date;
}

export interface NoticeDetailInfo {
  noticeIdx: number;
  title: string;
  content: string;
  creatorName: string;
  lastEditorName: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
