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

export enum IntranetLeaveTypeEnum {
  NORMAL = '근무',
  AM_HALF = '오전 반차',
  PM_HALF = '오후 반차',
  AM_QUARTER = '오전 반반차',
  PM_QUARTER = '오후 반반차',
  SICK_LEAVE = '병가',
  TRAINING = '훈련',
  HEALTH_LEAVE = '보건휴가',
  SPECIAL_LEAVE = '특별 휴무',
  ALTERNATIVE_LEAVE = '대체 휴무',
  FAMILY_EVENT_LEAVE = '경조 휴무',
  ANNUAL_LEAVE = '연차',
}

export enum IntranetAttendanceEnum {
  CHECK_IN = '출근',
  CHECK_OUT = '퇴근',
  EARLY_CHECK_OUT = '조기 퇴근',
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
  HOLD = 'H',
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

export enum LateStatusEnum {
  ON_TIME = '정상',
  LATE = '지각',
}

export enum DeviceTypeEnum {
  PC = 'PC',
  MOBILE = 'MOBILE',
  MAUNAL = 'MANUAL',
}
