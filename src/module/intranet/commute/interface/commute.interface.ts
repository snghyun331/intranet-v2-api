import { IntranetAttendanceEnum, IntranetLeaveTypeIdxEnum } from '../../../../common/constant/enum';

export interface InsertCheckInInfo {
  leaveTypeIdx: IntranetLeaveTypeIdxEnum;
  checkInIpAddr: string;
  commuteDate: string;
  checkInDeviceType: string;
  attendance: IntranetAttendanceEnum;
  checkInTime: Date;
}

export interface UpdateCheckInInfo {
  checkInIpAddr: string;
  commuteDate: string;
  checkInDeviceType: string;
  attendance: IntranetAttendanceEnum;
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
}
