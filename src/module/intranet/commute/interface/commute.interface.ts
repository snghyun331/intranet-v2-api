import { IntranetAttendanceEnum, IntranetLeaveTypeEnum, LateStatusEnum } from '../../../../common/constant/enum';

export interface InsertCheckInInfo {
  leaveType: IntranetLeaveTypeEnum;
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
  attendance: IntranetAttendanceEnum;
}

export interface UpdateCommuteTimeInfo {
  checkInTime: Date;
  checkOutTime: Date;
  updateReason: string;
  attendance: IntranetAttendanceEnum;
  workingMinutes: number;
  overtimeWorkingMinutes: number;
  checkInIpAddr: string | null;
  checkOutIpAddr: string | null;
  checkInDeviceType: string;
  checkOutDeviceType: string;
  lateStatus: LateStatusEnum;
}
