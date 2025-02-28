export interface LeaveImageInfo {
  imageName: string;
  imageSize: number;
  imageUrl: string;
}

export interface LeaveSummary {
  userIdx: number;
  userName: any;
  year: string;
  joinDate: any;
  hqName: any;
  teamName: any;
  gradeName: any;
  totalReceivedAnnualLeave: any;
  totalAnnualLeaveUsage: any;
  totalAnnualLeaveBalance: any;
  midJoinReceivedAnnualLeave?: any;
  yearsSinceJoin: any;
  oneYearAfterJoin: any;
  proRatedAnnualLeave: any;
}
