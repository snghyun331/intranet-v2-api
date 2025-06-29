export interface MeetingScheduleResponse {
  meetingDate: string;
  rooms: RoomSchedule[];
}

export interface RoomSchedule {
  roomIdx: number;
  roomName: string;
  capacity: number;
  timeSlots: TimeSlotInfo[];
}

export interface TimeSlotInfo {
  time: string;
  isAvailable: boolean;
  meeting?: MeetingInfo;
}

export interface MeetingInfo {
  reservationIdx: number;
  title: string;
  startTime: string;
  endTime: string;
  meetingType: string;
  writerName: string;
  ccUserInfo: CcUserInfo[];
  attendeeInfo: AttendeeInfo[];
}

export interface CcUserInfo {
  ccUserIdx: number;
  ccUserName: string;
}

export interface AttendeeInfo {
  attendeeIdx: number;
  attendeeName: string;
}
