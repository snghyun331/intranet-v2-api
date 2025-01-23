import { IntranetAttendanceEnum, LateStatusEnum } from '../../../../common/constant/enum';

export interface InsertCheckInInfo {
  attendance: IntranetAttendanceEnum;
  checkInIpAddr: string;
  commuteDate: string;
  lateStatus: LateStatusEnum;
  checkInDeviceType: string;
  checkInTime: Date;
}

export interface UpdateCheckInInfo {
  checkInIpAddr: string;
  commuteDate: string;
  lateStatus: LateStatusEnum;
  checkInDeviceType: string;
  checkInTime: Date;
}

export interface UpdateCheckOutInfo {
  commuteDate: string;
  checkOutDeviceType: string;
  checkOutTime: Date;
  earlyLeaveReason: string | null;
  workingMinutes: number;
  overtimeWorkingMinutes: number;
  checkOutIpAddr: string;
}

export interface UpdateCommuteTimeInfo {
  checkInTime: Date;
  checkOutTime: Date;
  updateReason: string;
  workingMinutes: number;
  overtimeWorkingMinutes: number;
  checkInIpAddr: string | null;
  checkOutIpAddr: string | null;
  checkInDeviceType: string;
  checkOutDeviceType: string;
  lateStatus: LateStatusEnum;
}
