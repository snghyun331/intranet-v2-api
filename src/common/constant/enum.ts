export enum NodeEnvEnum {
  TEST = 'dev',
  PROD = 'prod',
}

export enum GenderEnum {
  MAN = 'M',
  WOMAN = 'W',
}

export enum YNEnum {
  YES = 'Y',
  NO = 'N',
}

export enum MealTypeEnum {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
}

export enum MealAttendanceEnum {
  WORKING = '근무',
  REMOTE_WORK = '재택 근무',
  REST = '연차/휴무',
  AM_HALF = '오전 반차',
  PM_HALF = '오후 반차',
}

export enum IntranetLeaveTypeIdxEnum {
  NORMAL = 1, // 근무
  AM_HALF = 2, // 오전 반차
  PM_HALF = 3, // 오후 반차
  AM_QUARTER = 4, // 오전 반반차,
  PM_QUARTER = 5, // 오후 반반차,
  ANNUAL_LEAVE = 6, // 연차,
  SPECIAL_LEAVE = 7, // 특별 휴무,
  AM_SPECIAL_LEAVE = 8, // 특별 휴무(오전),
  PM_SPECIAL_LEAVE = 9, // 특별 휴무(오후),
  AM_QUARTER_SPECIAL_LEAVE = 10, // 특별 휴무(오전 반반),
  PM_QUARTER_SPECIAL_LEAVE = 11, // 특별 휴무(오후 반반),
  ALTERNATIVE_LEAVE = 12, // 대체 휴무,
  AM_ALTERNATIVE_LEAVE = 13, // 대체 휴무(오전),
  PM_ALTERNATIVE_LEAVE = 14, // 대체 휴무(오후),
  FAMILY_EVENT_LEAVE = 15, // 경조 휴무,
  HEALTH_LEAVE = 16, // 보건휴가,
  TRAINING = 17, // 훈련,
  AM_TRAINING = 18, // 훈련(오전),
  PM_TRAINING = 19, // 훈련(오후),
  SICK_LEAVE = 20, // 병가,
}

export enum IntranetAttendanceEnum {
  CHECK_IN = '출근',
  CHECK_IN_LATE = '출근(지각)',
  CHECK_OUT = '퇴근',
  EARLY_CHECK_OUT = '조기 퇴근',
  CHECK_OUT_LATE = '퇴근(지각)',
  EARLY_CHECK_OUT_LATE = '조기 퇴근(지각)',
}

export enum UserGradeEnum {
  CEO = '대표',
  DIRECTOR = '본부장',
  MANAGER = '팀장',
  LEADER = '책임',
  SENIOR = '선임',
  ADVISOR = '위원',
  INTERN = '인턴',
}

export enum UserGradeIdxEnum {
  CEO = 1,
  DIRECTOR = 2,
  MANAGER = 3,
  LEADER = 4,
  SENIOR = 5,
  ADVISOR = 6,
  INTERN = 7,
}

export enum HalfYearEnum {
  H1 = 'H1',
  H2 = 'H2',
}

export enum ConfirmEnum {
  NO = 'N',
  REJECT = 'R',
  YES = 'Y',
}

export enum ClearStatusEnum {
  NOT_YET = 'not_yet',
  COMPLETE = 'complete',
}

export enum QnaCategoryEnum {
  QUESTION = 'question',
  BUG = 'bug',
  PROPOSAL = 'proposal',
}

export enum OrderbyEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export enum SortbyEnum {
  GRADE = 'userGrade',
  BIRTH = 'userBirth',
  JOIN = 'joinDate',
  TEAM = 'teamName',
}

export enum AdminGradeEnum {
  HIGH_ADMIN = '상위 관리자',
  NORMAL_ADMIN = '일반 관리자',
}

export enum DeviceTypeEnum {
  PC = 'PC',
  MOBILE = 'MOBILE',
  MAUNAL = 'MANUAL',
}
