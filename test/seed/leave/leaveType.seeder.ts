import { DataSource, Repository } from 'typeorm';
import { LeaveTypeEntity } from '../../../src/entity/intranet/leave/leaveType.entity';
import { IntranetLeaveTypeIdxEnum } from '../../../src/common/constant/enum';

export const seedLeaveType = async (dataSource: DataSource): Promise<void> => {
  const leaveTypeRepository: Repository<LeaveTypeEntity> = dataSource.getRepository(LeaveTypeEntity);

  const leaveTypes = [
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_HALF,
      leaveType: '오전 반차',
      leaveReduceUnit: 0.5,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_HALF,
      leaveType: '오후 반차',
      leaveReduceUnit: 0.5,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_QUARTER,
      leaveType: '오전 반반차',
      leaveReduceUnit: 0.25,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_QUARTER,
      leaveType: '오후 반반차',
      leaveReduceUnit: 0.25,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE,
      leaveType: '연차',
      leaveReduceUnit: 1,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE,
      leaveType: '특별 휴무',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE,
      leaveType: '특별 휴무(오전)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE,
      leaveType: '특별 휴무(오후)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE,
      leaveType: '특별 휴무(오전 반반)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE,
      leaveType: '특별 휴무(오후 반반)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE,
      leaveType: '대체 휴무',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE,
      leaveType: '대체 휴무(오전)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE,
      leaveType: '대체 휴무(오후)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.FAMILY_EVENT_LEAVE,
      leaveType: '경조 휴무',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.HEALTH_LEAVE,
      leaveType: '보건휴가',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.TRAINING,
      leaveType: '훈련',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.AM_TRAINING,
      leaveType: '훈련(오전)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.PM_TRAINING,
      leaveType: '훈련(오후)',
      leaveReduceUnit: 0,
    },
    {
      leaveTypeIdx: IntranetLeaveTypeIdxEnum.SICK_LEAVE,
      leaveType: '병가',
      leaveReduceUnit: 0,
    },
  ];

  await leaveTypeRepository.save(leaveTypes);

  console.log('🌱 LeaveType 테이블 데이터 시딩 성공');
};
