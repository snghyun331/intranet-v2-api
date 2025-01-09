import { Controller } from '@nestjs/common';
import { UploadService } from './upload.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('업로드')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}
}
