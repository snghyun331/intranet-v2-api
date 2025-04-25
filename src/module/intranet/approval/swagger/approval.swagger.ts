import { ConfirmEnum } from '../../../../common/constant/enum';
import { SwaggerMethod } from '../../../../common/interface/swagger.interface';
import { UpdateConfirmDto } from '../dto/updateConfirm.dto';

export const USERS_INTRANET_APPROVAL: SwaggerMethod = {
  GET: {
    API_OPERATION: {
      summary: '결재 승인 내역 조회하기 API',
    },
    API_OK_RESPONSE: {
      content: {
        'application/json': {
          example: {
            statusCode: 200,
            message: 'success',
            data: [
              {
                commuteIdx: 1248,
                commuteDate: '2025-04-26',
                userIdx: 2,
                userName: '이승현',
                leaveTypeIdx: 4,
                leaveType: '오전 반반차',
                imageIdx: 51,
                imageName: 'proof.png',
                imageSize: 22751,
                imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/TEST/LEAVE/1248/proof.png',
                note: null,
                confirmYN: 'N',
                confirmDate: null,
                rejectDate: null,
                confirmPersonIdx: null,
                createdAt: '2025-04-25T02:30:27.252Z',
                relationType: 'APPROVER',
                confirmStatus: '승인 대기',
              },
              {
                commuteIdx: 1174,
                commuteDate: '2025-04-25',
                userIdx: 1,
                userName: '김현민',
                leaveTypeIdx: 4,
                leaveType: '오전 반반차',
                imageIdx: 48,
                imageName: 'proof.png',
                imageSize: 609224,
                imageUrl: 'https://acg-benefit.s3.ap-northeast-2.amazonaws.com/TEST/LEAVE/1174/proof.png',
                note: 'ooo',
                confirmYN: 'N',
                confirmDate: null,
                rejectDate: null,
                confirmPersonIdx: null,
                createdAt: '2025-04-24T00:52:58.946Z',
                relationType: 'APPROVER',
                confirmStatus: '승인 대기',
              },
            ],
          },
        },
      },
    },
  },
  PATCH: {
    API_OPERATION: {
      summary: '휴가 승인/반려하기 API',
    },
    API_PARAM1: {
      type: Number,
      name: 'commuteIdx',
      required: true,
      description: 'IDX',
    },
    API_BODY: {
      type: UpdateConfirmDto,
      examples: {
        a: {
          summary: '승인',
          value: {
            confirmYN: ConfirmEnum.YES,
          },
        },
        b: {
          summary: '반려',
          value: {
            confirmYN: ConfirmEnum.REJECT,
          },
        },
      },
      required: true,
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
