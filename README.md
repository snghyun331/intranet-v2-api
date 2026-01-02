# Benefit Management System

사내 인트라넷 및 복리후생 관리 시스템

## 주요 기능

- **사용자/관리자 관리** - 사용자 계정 및 권한 관리
- **근태 관리** - 출퇴근 기록, 연차/휴가 관리
- **복리후생 관리** - 복지 포인트 및 예산 관리
- **활동비 관리** - 부서별 활동비 신청/승인
- **식대 관리** - 식대 지원 내역 관리
- **공지사항** - 사내 공지사항 등록/조회
- **일정/회의 관리** - 회의 일정 관리
- **알림** - 사용자 알림 기능
- **파일 관리** - 파일 업로드/다운로드 및 엑셀 내보내기

## 기술 스택

| 분류 | 기술 |
|------|------|
| Backend | NestJS, TypeScript |
| Database | MariaDB (TypeORM), MongoDB (Mongoose) |
| Cache & Queue | Redis, Bull |
| Storage | AWS S3 |
| Auth | JWT, Passport |
| API Docs | Swagger |
| Testing | Jest |
| Container | Docker |

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run start:dev

# 빌드
npm run build

# Docker 실행
docker-compose up -d
```

## 환경 변수

`.env` 파일을 생성하여 필요한 환경 변수를 설정하세요.

## License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
