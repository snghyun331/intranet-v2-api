import { IsNotEmpty } from 'class-validator';

export class UploadImgDto {
  @IsNotEmpty()
  fieldname: string;

  @IsNotEmpty()
  originalname: string;

  @IsNotEmpty()
  encoding: string;

  @IsNotEmpty()
  mimetype: string;

  @IsNotEmpty()
  buffer: Buffer;
}
