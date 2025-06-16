import { LeaveDetailDto } from '../dto/createLeave.dto';

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
  hqName: string | null;
  teamName: string | null;
  gradeName: string;
  totalReceivedAnnualLeave: number;
  totalAnnualLeaveUsage: number;
  totalAnnualLeaveBalance: number;
  midJoinReceivedAnnualLeave?: number;
  yearsSinceJoin?: number;
  oneYearAfterJoin?: string;
  proRatedAnnualLeave: number;
}

export interface LeaveUsageStats {
  fullLeaveUsage: number;
  halfLeaveUsage: number;
  quarterLeaveUsage: number;
  specialLeaveUsage: number;
  alternativeLeaveUsage: number;
  sickLeaveUsage: number;
  trainingLeaveUsage: number;
  familyEventLeaveUsage: number;
  healthLeaveUsage: number;
  totalReceivedSpecialLeave: number;
  totalReceivedAlternativeLeave: number;
}

export interface LeaveDetail extends LeaveDetailDto {
  firstUpdatedAt?: Date;
}
