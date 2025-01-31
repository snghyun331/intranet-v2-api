import { BadRequestException } from '@nestjs/common';

export const noticeImageOptions = {
  fileFilter: (request: any, file: any, callback: any) => {
    const fileTypeFilter = [
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/gif',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ];
    if (!fileTypeFilter.includes(file.mimetype)) {
      callback(
        new BadRequestException("공지사항 첨부파일 형식은 'jpg', 'jpeg', 'png','bmp', 'webp,'gif'만 허용합니다."),
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 200 * 1024 * 1024, // 최대 200MB
    files: 1,
  },
};

export const leaveImageOptions = {
  fileFilter: (request: any, file: any, callback: any) => {
    const fileTypeFilter = [
      'image/jpeg',
      'image/png',
      'image/bmp',
      'image/gif',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    if (!fileTypeFilter.includes(file.mimetype)) {
      callback(
        new BadRequestException("첨부파일 형식은 'jpg', 'jpeg', 'png','bmp', 'webp, 'gif', 'pdf'만 허용합니다."),
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: 500 * 1024 * 1024, // 최대 500MB
    files: 1,
  },
};
