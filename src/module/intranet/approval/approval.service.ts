import { Injectable } from '@nestjs/common';
import { ApprovalRepository } from './repository/approval.repository';

@Injectable()
export class ApprovalService {
  constructor(private readonly approvalRepository: ApprovalRepository) {}
}
