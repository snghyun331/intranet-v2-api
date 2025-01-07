import { BadRequestException } from '@nestjs/common';

export const noticeImageOptions = {
  fileFilter: (request: any, file: any, callback: any) => {
    const fileTypeFilter = ['image/jpeg', 'image/png', 'image/bmp', 'image/gif', 'image/jpg', 'image/svg+xml'];
    if (!fileTypeFilter.includes(file.mimetype)) {
      callback(new BadRequestException("공지사항 첨부파일 형식은 '.jpg', '.jpeg', '.png','.bmp', 'gif'만 허용합니다."));
    }
    callback(null, true);
  },
  limits: {
    fileSize: 5242880, // 최대 5MB
    files: 1,
  },
};
