import { IntranetLeaveTypeEnum } from './enum';

export const NUM_OF_ROWS: number = 30;

export const PAGE_NO: number = 1;

export const DEFAULT_LUNCH_RATE: number = 10000;

export const DEFAULT_BREAKFAST_RATE: number = 9000;

export const DEFAULT_DINNER_RATE: number = 11000;

export const DEFAULT_TOTAL_WELFARE: number = 200000;

export const ACTIVITY_APPROVERS: string[] = ['김현근', '박민수', '윤이나'];

export const NORMAL_WORKING_MINUTES: number = 9 * 60;

export const HALF_HOLIDAY_WORKING_MINUTES: number = 4 * 60;

export const QUARTER_HOLIDAY_WORKING_MINUTES: number = 7 * 60;

export const FULL_DAY_REST_LISTS: IntranetLeaveTypeEnum[] = [
  IntranetLeaveTypeEnum.SICK_LEAVE,
  IntranetLeaveTypeEnum.TRAINING,
  IntranetLeaveTypeEnum.HEALTH_LEAVE,
  IntranetLeaveTypeEnum.SPECIAL_LEAVE,
  IntranetLeaveTypeEnum.ALTERNATIVE_LEAVE,
  IntranetLeaveTypeEnum.FAMILY_EVENT_LEAVE,
  IntranetLeaveTypeEnum.ANNUAL_LEAVE,
];

export const PARTIAL_DAY_REST_LISTS: IntranetLeaveTypeEnum[] = [
  IntranetLeaveTypeEnum.AM_HALF,
  IntranetLeaveTypeEnum.AM_QUARTER,
  IntranetLeaveTypeEnum.PM_HALF,
  IntranetLeaveTypeEnum.PM_QUARTER,
];
