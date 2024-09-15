import { YNEnum } from 'src/common/constant/enum';

export interface AxiosHoliday {
  dateKind: string;
  dateName: string;
  isHoliday: YNEnum;
  locdate: number;
  seq: number;
}
