import { SwaggerMethod } from '@common/interface/swagger.interface';
import { CreateUserDto } from '@user/dto/createUser.dto';
import { SearchUserDto } from '@user/dto/searchUser.dto';
import { UpdateMyInfoDto } from '@user/dto/updateMyInfo.dto';
import { UpdateUserDto } from '@user/dto/updateUser.dto';

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
              userIdx: 2,
              userName: '이승현',
              userGender: 'W',
              userCell: '010-0000-0000',
              userEmail: 'shlee1@acghr.co.kr',
              userBirth: '2000-04-23',
              userAddress: 'dsdf',
              joinDate: '2023-03-04',
              hqName: 'HR솔루션본부',
              teamName: 'HR Tech',
              gradeName: '본부장',
              adminRole: 'Y',
              checkInTime: null,
              availCheckOutTime: null,
              attendance: null,
              workingMinutes: null,
              leaveTypeIdx: null,
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
  PUT: {
    API_OPERATION: {
      summary: '로그인한 사용자 기본정보 수정 API',
    },
    API_BODY: {
      type: UpdateMyInfoDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            userAddress: '경기도 고양시',
            userCell: '010-4194-5712',
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '내 기본정보 수정 성공',
          },
        },
      },
    },
  },
};

export const USERS_MY_PW: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '내 비밀번호 변경 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '내 비밀번호 변경 성공',
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '기존 비밀번호X',
              value: {
                message: '기존 비밀번호가 올바르지 않습니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 18. 오전 10:51:17',
                path: '/users/me/password',
              },
            },
            b: {
              summary: '비밀번호 != 비밀번호 확인',
              value: {
                message: '비밀번호가 같지 않습니다',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 18. 오전 10:52:27',
                path: '/users/me/password',
              },
            },
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
  PATCH: {
    API_OPERATION: {
      summary: '직원 활성화/비활성화 선택 API',
    },
    API_PARAM1: {
      name: 'userIdx',
      type: Number,
      required: true,
      description: '유저IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
          },
        },
      },
    },
  },
  DELETE: {
    API_OPERATION: {
      summary: '직원 삭제(완전삭제) API',
    },
    API_PARAM1: {
      type: Number,
      name: 'userIdx',
      required: true,
      description: '유저IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '이미 삭제 or 올바른 유저X',
              value: {
                message: '이미 삭제된 유저이거나 올바른 유저가 아닙니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 12. 4. 오전 10:26:09',
                path: '/admin/users/100',
              },
            },
          },
        },
      },
    },
  },
  PUT: {
    API_OPERATION: {
      summary: '직원 수정 API',
    },
    API_PARAM1: {
      name: 'userIdx',
      type: Number,
      description: '유저(직원)IDX',
      required: true,
    },
    API_BODY: {
      type: UpdateUserDto,
      examples: {
        a: {
          summary: '어드민O',
          value: {
            id: 'shlee1',
            userName: '이승현',
            gradeIdx: 1,
            userEmail: 'shlee1@acghr.co.kr',
            userCell: '010-4194-5718',
            userAddress: '경기도 고양시 덕양구',
            userBirth: '2000-03-31',
            userGender: 'W',
            joinDate: '2024-03-04',
            adminRole: 'Y',
            adminGradeIdx: 1,
            hqIdx: 1,
            teamIdx: 8,
          },
        },
        b: {
          summary: '어드민X',
          value: {
            id: 'shlee1',
            userName: '이승현',
            gradeIdx: 1,
            userEmail: 'shlee1@acghr.co.kr',
            userCell: '010-4194-5718',
            userAddress: '경기도 고양시 덕양구',
            userBirth: '2000-03-31',
            userGender: 'W',
            joinDate: '2024-03-04',
            adminRole: 'N',
            hqIdx: 1,
            teamIdx: 8,
          },
        },
      },
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '유저 정보 수정 성공',
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '어드민은 반드시 어드민 등급 설정',
              value: {
                message: '어드민인 유저는 어드민 등급을 설정해야합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 25. 오후 3:08:11',
                path: '/admin/users/1',
              },
            },
            b: {
              summary: '어드민이 아니면 어드민 등급 설정X',
              value: {
                message: '어드민이 아닌 유저는 어드민 등급을 설정할 수 없습니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 25. 오후 3:09:47',
                path: '/admin/users/1',
              },
            },
          },
        },
      },
    },
  },
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
              total: 1,
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
                  hqIdx: 1,
                  teamIdx: 6,
                  gradeIdx: 2,
                  hqName: 'HR솔류션본부',
                  teamName: null,
                  gradeName: '본부장',
                  adminRole: 'N',
                  adminGradeIdx: null,
                  comment: null,
                  userAvail: 'N',
                },
              ],
            },
          },
        },
      },
    },
    API_BAD_REQUEST_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: 'sortby와 orderby는 둘도 없는 단짝',
              value: {
                message: 'sortby와 orderby는 함께 제공되거나 둘 다 없어야 합니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 15. 오후 2:16:21',
                path: '/admin/users?pageNo=1&perPage=20&sortby=userGrade',
              },
            },
            b: {
              summary: '지원하지 않는 정렬 기준',
              value: {
                message: '지원하지 않는 정렬 기준입니다.',
                error: 'Bad Request',
                statusCode: 400,
                timeStamp: '2024. 11. 15. 오후 2:16:21',
                path: '/admin/users?pageNo=1&perPage=20&sortby=userEmail',
              },
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
          summary: '어드민X',
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
            adminRole: 'N',
          },
        },
        b: {
          summary: '어드민0',
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
            adminRole: 'Y',
            adminGradeIdx: 2,
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
    API_CONFLICT_RESPONSE: {
      content: {
        'application/json': {
          examples: {
            a: {
              summary: '이미 가입된 유저',
              value: {
                message: '이미 가입된 유저입니다.(아이디 중복)',
                error: 'Conflict',
                statusCode: 409,
                timeStamp: '2024. 11. 15. 오전 11:20:58',
                path: '/admin/users/1',
              },
            },
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
    API_PARAM2: {
      name: 'userIdx',
      type: Number,
      required: true,
      description: '수정할 직원IDX',
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

export const USERS_HQ_IDX: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 본부의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 본부 IDX 조회 성공',
            data: [
              {
                hqIdx: 1,
                hqName: 'HR솔류션본부',
              },
              {
                hqIdx: 2,
                hqName: 'HR컨설팅본부',
              },
            ],
          },
        },
      },
    },
  },
};

export const USERS_TEAM_IDX: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 팀의 IDX 정보 조회 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: '모든 팀 IDX 조회 성공',
            data: [
              {
                teamIdx: 1,
                teamName: '경영진',
              },
              {
                teamIdx: 2,
                teamName: 'P&C',
              },
              {
                teamIdx: 3,
                teamName: 'Assessment1',
              },
              {
                teamIdx: 4,
                teamName: 'Assessment2',
              },
              {
                teamIdx: 5,
                teamName: 'Assessment3',
              },
              {
                teamIdx: 6,
                teamName: 'Consulting',
              },
              {
                teamIdx: 7,
                teamName: 'HR 운영',
              },
              {
                teamIdx: 8,
                teamName: 'HR Tech',
              },
            ],
          },
        },
      },
    },
  },
};

export const ADMIN_USERS_IDXS: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '모든 사용자의 IDX 정보 조회(어드민용) API',
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

export const USERS_BIRTH: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '생일자 조회 API',
    },
    API_QUERY1: {
      name: 'month',
      type: String,
      required: true,
      example: '3',
      description: '조회할 월',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                userIdx: 2,
                userName: '이승현',
                gradeName: '본부장',
                userBirth: '2000-03-31',
              },
            ],
          },
        },
      },
    },
  },
};

export const ADMIN_SEARCH_PREFIX_USERNAME: SwaggerMethod = {
  POST: {
    API_OPERATION: {
      summary: '백엔드 테스트용(나중에 삭제)',
    },
    API_BODY: {
      type: SearchUserDto,
      examples: {
        a: {
          summary: '예시',
          value: {
            userIdx: 1,
            userName: '김현민',
          },
        },
      },
    },
  },
  GET: {
    API_OPERATION: {
      summary: '사용자 이름 검색 API',
    },
    API_QUERY1: {
      type: String,
      name: 'searchWord',
      required: false,
      example: '김현',
      description: 'prefix 단어',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                userName: '김현민',
                userIdx: 1,
              },
            ],
          },
        },
      },
    },
  },
};

export const ADMIN_USERS_COMMENT: SwaggerMethod = {
  PATCH: {
    API_OPERATION: {
      summary: '어드민 직원 특이사항 수정 API',
    },
    API_PARAM1: {
      name: 'userIdx',
      type: Number,
      required: true,
      description: '유저IDX',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
          },
        },
      },
    },
  },
};
