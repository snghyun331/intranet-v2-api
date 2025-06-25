import 'dotenv/config';
import axios, { AxiosResponse } from 'axios';
import * as queryString from 'query-string';
import { v4 as uuidv4 } from 'uuid';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { calculateByte } from '@/common/utils/utility';
import { SmsRepository } from './repository/sms.repository';

@Injectable()
export class SmsService {
  constructor(
    public readonly configService: ConfigService,
    private readonly smsRepository: SmsRepository,
  ) {}

  /* 가비아 AccessToken을 발급받는 메서드 */
  async getSmsToken(): Promise<string> {
    // 토큰을 발급받기 위한 API URL
    const tokenUrl = 'https://sms.gabia.com/oauth/token';
    // baseApiKey는 base64(SMS_ID:API_KEY)
    const baseApiKey: string = Buffer.from(`${process.env.SMS_ID}:${process.env.SMS_API_KEY}`).toString('base64');
    const postData: string = queryString.stringify({ grant_type: 'client_credentials' });
    const getSmsOptions: any = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + baseApiKey,
      },
      data: postData,
    };
    // 응답값을 받아오는 axios 요청
    const response: AxiosResponse = await axios(tokenUrl, getSmsOptions);
    // response중 access_token값만 가져온다
    const token: string = response.data.access_token;

    return token;
  }

  /* 가비아 SMS 발송 메서드 */
  async noticeSms(
    fromPhoneNumber: string,
    toPhoneNumber: string,
    message: string,
    smsMessageIdx: number,
  ): Promise<void> {
    try {
      const smsToken: string = await this.getSmsToken();
      const smsId: string = this.configService.get<string>('SMS_ID');
      // baseApiKey는 base64(SMS_ID:ACCESS_TOKEN)
      const baseApiKey: string = Buffer.from(smsId + ':' + smsToken).toString('base64');
      // 고유한 refKey를 위한 uuidv4
      const refKeyStr: string = uuidv4();
      // 문자 발송을 위한 postData FORM
      const postData: string = queryString.stringify({
        phone: toPhoneNumber,
        callback: fromPhoneNumber.replace(/-/g, ''), // 010-2345-6789 -> 01023456789
        message,
        refKey: refKeyStr,
        is_foreign: 'N', // 해외발송 여부
      });
      const sendSmsOptions: object = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + baseApiKey,
        },
        data: postData,
      };
      const baseUrl = 'https://sms.gabia.com:443/api/send/';

      /* message의 Byte 길이 > 90 여부에 따른 LMS & SMS 발송 분기 */
      const url: string = calculateByte(message) > 90 ? baseUrl + 'lms' : baseUrl + 'sms';

      await axios(url, sendSmsOptions);

      await this.smsRepository.handleSmsSuccess(smsMessageIdx);
    } catch (err) {
      await this.smsRepository.handleSmsFailure(smsMessageIdx, err);
      throw new BadRequestException('SMS 발송에 실패했습니다.');
    }
  }
}
