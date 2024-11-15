import { SwaggerMethod } from '../../../common/interface/swagger.interface';
import { CreateUserDto } from '../dto/createUser.dto';

export const USERS_IDXS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 사용자의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 사용자 IDX 조회 성공',
            data: [
              {
                userIdx: 1,
                userName: '이승현',
              },
              {
                userIdx: 2,
                userName: '김현민',
              },
              {
                userIdx: 3,
                userName: '이혜빈',
              },
            ],
          },
        },
      },
    },
  },
};

export const USERS_MY: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '로그인한 사용자 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '현재 로그인 되어있는 사용자 정보 조회 성공',
            data: {
              userIdx: 1,
              userName: '이승현',
              userGender: 'W',
              userCell: '010-4194-5718',
              userEmail: 'shlee1@acghr.co.kr',
              userBirth: '2000-03-31',
              joinDate: '2024-03-04',
              hqName: 'HR솔류션본부',
              teamName: 'HR Tech',
              gradeName: '위원',
              adminRole: 'Y',
            },
          },
        },
      },
    },
    API_NOT_FOUND_RESPONSE: {
      content: {
        'application/json': {
          example: {
            message: '존재하지 않는 사용자입니다.',
            error: 'Not Found',
            statusCode: 404,
            timeStamp: '2024. 10. 23. 오후 2:38:32',
            path: '/users/me',
          },
        },
      },
    },
  },
};

export const USERS_GRADES_IDX: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 직급의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 직급 IDX 조회 성공',
            data: [
              {
                gradeIdx: 1,
                gradeName: '대표',
              },
              {
                gradeIdx: 2,
                gradeName: '본부장',
              },
              {
                gradeIdx: 3,
                gradeName: '팀장',
              },
              {
                gradeIdx: 4,
                gradeName: '책임',
              },
              {
                gradeIdx: 5,
                gradeName: '선임',
              },
              {
                gradeIdx: 6,
                gradeName: '위원',
              },
              {
                gradeIdx: 7,
                gradeName: '인턴',
              },
            ],
          },
        },
      },
    },
  },
};

export const ADMIN_USERS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '어드민 모든 직원 정보 조회 API',
      description: '입사일 기준으로 내림차순 정렬됩니다.',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 직원 정보 조회 성공',
            data: {
              totalPage: 1,
              total: 9,
              users: [
                {
                  userIdx: 7,
                  userName: '김현근',
                  userGender: 'M',
                  userCell: '010-6229-6660',
                  userAddress: null,
                  userEmail: 'hkkim@acghr.co.kr',
                  userBirth: '1972-06-18',
                  joinDate: '2024-05-02',
                  hqName: 'HR솔류션본부',
                  teamName: null,
                  gradeName: '본부장',
                  adminRole: 'N',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 6,
                  userName: '안지훈',
                  userGender: 'M',
                  userCell: '010-2020-9284',
                  userAddress: null,
                  userEmail: 'jhahn1@acghr.co.kr',
                  userBirth: '1996-11-11',
                  joinDate: '2024-04-05',
                  hqName: null,
                  teamName: 'P&C',
                  gradeName: '위원',
                  adminRole: 'Y',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 3,
                  userName: '윤용설',
                  userGender: 'M',
                  userCell: '010-6209-2024',
                  userAddress: null,
                  userEmail: 'ysyoon@acghr.co.kr',
                  userBirth: '2000-03-31',
                  joinDate: '2024-03-04',
                  hqName: 'HR솔류션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  adminRole: 'N',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 2,
                  userName: '김현민',
                  userGender: 'M',
                  userCell: '010-6209-2023',
                  userAddress: null,
                  userEmail: 'hmkim@acghr.co.kr',
                  userBirth: '2000-03-31',
                  joinDate: '2024-03-04',
                  hqName: 'HR솔류션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  adminRole: 'Y',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 1,
                  userName: '이승현',
                  userGender: 'W',
                  userCell: '010-4194-5718',
                  userAddress: null,
                  userEmail: 'shlee1@acghr.co.kr',
                  userBirth: '2000-03-31',
                  joinDate: '2024-03-04',
                  hqName: 'HR솔류션본부',
                  teamName: 'HR Tech',
                  gradeName: '위원',
                  adminRole: 'Y',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 9,
                  userName: '윤이나',
                  userGender: 'W',
                  userCell: '010-4912-3478',
                  userAddress: null,
                  userEmail: 'yoon@acghr.co.kr',
                  userBirth: '1989-07-12',
                  joinDate: '2017-04-05',
                  hqName: null,
                  teamName: 'P&C',
                  gradeName: '팀장',
                  adminRole: 'Y',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 8,
                  userName: '김현해',
                  userGender: 'M',
                  userCell: '010-4102-3393',
                  userAddress: null,
                  userEmail: 'hhkim@acghr.co.kr',
                  userBirth: '1989-07-12',
                  joinDate: '2017-04-05',
                  hqName: 'HR솔류션본부',
                  teamName: 'Consulting',
                  gradeName: '팀장',
                  adminRole: 'N',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 4,
                  userName: '박민수',
                  userGender: 'M',
                  userCell: '010-2536-5474',
                  userAddress: null,
                  userEmail: 'mspark@acghr.co.kr',
                  userBirth: '1974-01-18',
                  joinDate: '2010-01-02',
                  hqName: 'HR컨설팅본부',
                  teamName: null,
                  gradeName: '본부장',
                  adminRole: 'N',
                  comment: null,
                  userAvail: null,
                },
                {
                  userIdx: 5,
                  userName: '정진우',
                  userGender: 'M',
                  userCell: '010-5585-1152',
                  userAddress: null,
                  userEmail: 'jwjung@acghr.co.kr',
                  userBirth: '1971-07-11',
                  joinDate: '2008-06-05',
                  hqName: null,
                  teamName: 'P&C',
                  gradeName: '대표',
                  adminRole: 'Y',
                  comment: null,
                  userAvail: null,
                },
              ],
            },
          },
        },
      },
    },
  },
  POST: {
    API_OPERATION: {
      summary: '직원 등록 API',
    },
    API_BODY: {
      type: CreateUserDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            id: 'wony',
            userName: '장원영',
            gradeIdx: 7,
            userEmail: 'wony@acghr.co.kr',
            userCell: '010-0000-0000',
            userAddress: '서울시 청담동',
            userBirth: '2004-08-31',
            userGender: 'W',
            joinDate: '2024-11-15',
          },
        },
      },
    },
    API_CREATED_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 201,
            message: '새로운 유저 등록 성공',
          },
        },
      },
    },
  },
};

export const ADMIN_USERS_CHECK: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '직원 등록 아이디 중복확인 API',
    },
    API_PARAM1: {
      name: 'loginId',
      type: String,
      required: true,
      description: '등록할 로그인 아이디',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '아이디 중복확인 성공',
            data: {
              id: 'shlee12',
            },
          },
        },
      },
    },
    API_CONFLICT_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '중복 아이디를 입력',
              value: {
                message: '중복된 ID입니다. 다른 ID를 입력해 주세요.',
                error: 'Conflict',
                statusCode: 409,
                timeStamp: '2024. 11. 15. 오전 11:20:58',
                path: '/admin/users/check-login-id/shlee1',
              },
            },
          },
        },
      },
    },
  },
};
