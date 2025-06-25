export const QUEUE_RETRY_CONFIG = {
  ATTEMPTS: 5, // 최대 재시도 횟수
  BACKOFF: 2000, // 실패 후 재시도 대기 시간 (ms)
  COMPLETE_AGE: 1 * 60 * 60, // 성공 기록 1시간 유지 (초 단위)
  FAIL_AGE: 1 * 60 * 60, // 실패 기록 1시간 유지 (초 단위)
};
