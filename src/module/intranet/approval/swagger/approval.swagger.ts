import { ConfirmEnum } from '../../../../common/constant/enum';
import { SwaggerMethod } from '../../../../common/interface/swagger.interface';
import { UpdateConfirmDto } from '../dto/updateConfirm.dto';

export const USERS_INTRANET_APPROVAL: SwaggerMethod = {
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
