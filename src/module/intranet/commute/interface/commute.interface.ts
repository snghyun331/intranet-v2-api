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
