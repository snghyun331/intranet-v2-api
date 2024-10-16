export class ValidationDetailDto {
  field: string;
  error: string[];
}

export class ValidationErrorBodyDto {
  statusCode: number;
  message: string;
  details: any[];
  error: string;
}
