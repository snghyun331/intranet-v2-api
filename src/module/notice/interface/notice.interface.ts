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
  imageIdx: number;
  imageName: string;
  imageSize: number;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NoticeImageInfo {
  imageName: string;
  imageSize: number;
  imageUrl: string;
}
