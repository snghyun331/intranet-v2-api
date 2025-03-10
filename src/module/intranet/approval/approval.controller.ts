import { Controller } from '@nestjs/common';
import { ApprovalService } from './approval.service';

@Controller('users/intranet/approval')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}
}
