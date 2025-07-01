import { PickType } from '@nestjs/swagger';
import { CreateMeetingReservationDto } from './createMeeting.dto';

export class UpdateMeetingReservationDto extends PickType(CreateMeetingReservationDto, [
  'title',
  'content',
  'meetingDate',
  'startTime',
  'endTime',
  'meetingType',
  'roomId',
  'description',
  'ccUserIdxs',
  'attendeeUserIdxs',
] as const) {}
