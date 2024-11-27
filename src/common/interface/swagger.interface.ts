import {
  ApiBodyOptions,
  ApiOperationOptions,
  ApiParamOptions,
  ApiQueryOptions,
  ApiResponseOptions,
} from '@nestjs/swagger';

interface SwaggerMethodCommon {
  API_OPERATION: ApiOperationOptions;
  API_PARAM1?: ApiParamOptions;
  API_PARAM2?: ApiParamOptions;
  API_PARAM3?: ApiParamOptions;
  API_QUERY1?: ApiQueryOptions;
  API_QUERY2?: ApiQueryOptions;
  API_QUERY3?: ApiQueryOptions;
  API_BODY?: ApiBodyOptions;
  API_OK_RESPONSE?: ApiResponseOptions;
  API_BAD_REQUEST_RESPONSE?: ApiResponseOptions;
  API_UNAUTHORIZED_RESPONSE?: ApiResponseOptions;
  API_FORBIDDEN_RESPONSE?: ApiResponseOptions;
  API_NOT_FOUND_RESPONSE?: ApiResponseOptions;
  API_CONFLICT_RESPONSE?: ApiResponseOptions;
  API_BAD_GATEWAY_RESPONSE?: ApiResponseOptions;
  API_INTERNEL_SERVER_ERR_RESPONSE?: ApiResponseOptions;
}

interface PostSwaggerMethod extends SwaggerMethodCommon {
  API_CREATED_RESPONSE?: ApiResponseOptions;
}

export interface SwaggerMethod {
  POST?: PostSwaggerMethod;
  GET?: SwaggerMethodCommon;
  PUT?: SwaggerMethodCommon;
  PATCH?: SwaggerMethodCommon;
  DELETE?: SwaggerMethodCommon;
}
