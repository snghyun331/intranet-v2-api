import { HttpService } from '@nestjs/axios';
import { BadRequestException, Inject, Injectable, Logger, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { AxiosResponse } from 'axios';
import { NUM_OF_ROWS, PAGE_NO } from 'src/common/constant/constant';
import { errSeparation, getDateFormYYYYMMDD } from 'src/common/utils/utility';
import { AxiosHoliday } from './interface/axiosData.interface';
import { SchedulerRepository } from './repository/scheduler.repository';
import { HolidayInfoDto } from './dto/holiday.dto';

@Injectable()
export class SchedulerService {
  constructor(
    @Inject(Logger)
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly schedulerRepository: SchedulerRepository,
    public readonly configService: ConfigService,
  ) {}

  // 매년 12월 1일에 다음년도 공휴일 수집
  @Cron('0 0 1 12 *')
  async insertHolidayData() {
    this.logger.log('🚀 Start Inserting Holiday Info Job !');
    const SOL_YEAR: number = new Date().getFullYear() + 1;
    const HOLIDAY_API_KEY: string = this.configService.get<string>('HOLIDAY_API_KEY');
    const HOLIDAY_API_URL: string =
      this.configService.get<string>('HOLIDAY_API_URL') +
      '?serviceKey=' +
      HOLIDAY_API_KEY +
      '&solYear=' +
      SOL_YEAR.toString() +
      '&numOfRows=' +
      NUM_OF_ROWS.toString() +
      '&pageNo=' +
      PAGE_NO.toString() +
      '&_type=json';

    try {
      const axiosResponse: AxiosResponse = await this.httpService.axiosRef.get(HOLIDAY_API_URL);
      const axiosHolidayList: AxiosHoliday[] = axiosResponse.data.response?.body?.items?.item;

      if (!axiosHolidayList || axiosHolidayList.length === 0) {
        throw new BadRequestException('공휴일 정보 수집에 실패했습니다.');
      }

      await Promise.all(
        axiosHolidayList.map(async (axiosHoliday) => {
          const holidayDate: string = getDateFormYYYYMMDD(axiosHoliday.locdate.toString());
          const holidayInfo: HolidayInfoDto = { holidayName: axiosHoliday.dateName, holidayDate };
          await this.schedulerRepository.insertHolidayInfo(holidayInfo);
        }),
      );
      this.logger.log('🏁 Holiday Info Job Completed!');
    } catch (err) {
      const statusCode = err.response.status;
      const errMsg = err.response.data;

      errSeparation(statusCode, errMsg);
    }
  }
}
