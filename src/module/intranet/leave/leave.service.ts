import { Injectable } from '@nestjs/common';
import { LeaveRepository } from './repository/leave.repository';
import { EntityManager } from 'typeorm';
import { CreateLeaveDto } from './dto/createLeave.dto';

@Injectable()
export class LeaveService {
  constructor(private readonly leaveRepository: LeaveRepository) {}

  async createLeave(leaveInfo: CreateLeaveDto, manager: EntityManager): Promise<void> {
    return;
  }
}
