import { IntranetLeaveTypeIdxEnum } from './enum';

export const NUM_OF_ROWS: number = 30;

export const PAGE_NO: number = 1;

export const DEFAULT_LUNCH_RATE: number = 10000;

export const DEFAULT_BREAKFAST_RATE: number = 9000;

export const DEFAULT_DINNER_RATE: number = 11000;

export const DEFAULT_TOTAL_WELFARE: number = 200000;

export const ACTIVITY_APPROVERS: string[] = ['김현근', '박민수', '윤이나', '이승현'];

export const NORMAL_WORKING_MINUTES: number = 9 * 60;

export const HALF_HOLIDAY_WORKING_MINUTES: number = 4 * 60;

export const QUARTER_HOLIDAY_WORKING_MINUTES: number = 7 * 60;

export const AM_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.AM_HALF,
  IntranetLeaveTypeIdxEnum.AM_TRAINING,
  IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE,
]);

export const AM_QUARTER_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.AM_QUARTER,
  IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE,
]);

export const PM_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.PM_HALF,
  IntranetLeaveTypeIdxEnum.PM_TRAINING,
  IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE,
]);

export const PM_QUARTER_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.PM_QUARTER,
  IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE,
]);

export const PARTIAL_DAY_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  ...AM_REST_LISTS,
  ...AM_QUARTER_REST_LISTS,
  ...PM_REST_LISTS,
  ...PM_QUARTER_REST_LISTS,
]);

export const FULL_DAY_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.SICK_LEAVE,
  IntranetLeaveTypeIdxEnum.TRAINING,
  IntranetLeaveTypeIdxEnum.HEALTH_LEAVE,
  IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE,
  IntranetLeaveTypeIdxEnum.FAMILY_EVENT_LEAVE,
  IntranetLeaveTypeIdxEnum.ANNUAL_LEAVE,
]);

export const ANNUAL_REST_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE,
  IntranetLeaveTypeIdxEnum.AM_HALF,
  IntranetLeaveTypeIdxEnum.PM_HALF,
  IntranetLeaveTypeIdxEnum.AM_QUARTER,
  IntranetLeaveTypeIdxEnum.PM_QUARTER,
]);

export const HALF_ANNUAL_LEAVE_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.AM_HALF,
  IntranetLeaveTypeIdxEnum.PM_HALF,
]);

export const QUARTER_ANNUAL_LEAVE_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.AM_QUARTER,
  IntranetLeaveTypeIdxEnum.PM_QUARTER,
]);

export const SPECIAL_LEAVE_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.AM_SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.PM_SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.AM_QUARTER_SPECIAL_LEAVE,
  IntranetLeaveTypeIdxEnum.PM_QUARTER_SPECIAL_LEAVE,
]);

export const ALTERNATIVE_LEAVE_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.ALTERNATIVE_LEAVE,
  IntranetLeaveTypeIdxEnum.AM_ALTERNATIVE_LEAVE,
  IntranetLeaveTypeIdxEnum.PM_ALTERNATIVE_LEAVE,
]);

export const TRAINING_LEAVE_LISTS: Set<IntranetLeaveTypeIdxEnum> = new Set([
  IntranetLeaveTypeIdxEnum.TRAINING,
  IntranetLeaveTypeIdxEnum.AM_TRAINING,
  IntranetLeaveTypeIdxEnum.PM_TRAINING,
]);
