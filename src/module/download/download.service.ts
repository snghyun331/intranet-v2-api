import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx-js-style';
import * as fs from 'fs';
import { mealExcelAdminTemplate, mealExcelAdminDecorate } from './template/mealExcel.template';
import { DownloadRepository } from './repository/download.repository';
import { DownloadMealBalanceDto, DownloadMealDto } from './dto/downloadMeal.dto';
import { MealStatsAdminInfo } from '../meal/interface/meal.interface';
import { mealStatsExcelAdminDecorate, mealStatsExcelAdminTemplate } from './template/mealBalanceExcel.template';

@Injectable()
export class DownloadService {
  constructor(
    private readonly downloadRepository: DownloadRepository,
    public readonly configService: ConfigService,
  ) {}

  async downloadMealExcel({ year, month, userIdxList }: DownloadMealDto) {
    const host = this.configService.get<string>('SERVER_URL');
    const filePath = 'resource/download/meal';
    const downloadPathList = [];
    await Promise.all(
      userIdxList.map(async (userIdx) => {
        const { userName } = await this.downloadRepository.getUserNameByIdx(userIdx);
        const fileName = `ACG_식대정리_Template_${year}년_${month}월_${userName}.xlsx`;
        const downloadPath = `${host}/${filePath}/${fileName}`;

        /* 디렉토리 관리 */
        if (!fs.existsSync(filePath)) {
          // filePath 폴더가 존재하지 않을 시, 생성합니다.
          fs.mkdirSync(filePath, { recursive: true });
        } else if (fs.existsSync(`${filePath}/${fileName}`)) {
          // filePath 폴더에 fileName이 존재하면 기존 파일은 삭제합니다.
          fs.rmSync(`${filePath}/${fileName}`, { recursive: true });
        }

        /* 식대 내역 시트 */
        const yearToNum: number = Number(year);
        const monthToNum: number = Number(month);
        const mealList = await this.downloadRepository.getMealList(yearToNum, monthToNum, userIdx);
        const xlsxData = mealExcelAdminTemplate(mealList);
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(xlsxData);
        mealExcelAdminDecorate(worksheet);
        XLSX.utils.book_append_sheet(workbook, worksheet, '내역');
        workbook.Props = {
          Title: 'ACG 식대 파일',
          Subject: `${year}년_${month}월_${userName}_식대 파일`,
        };

        await XLSX.writeFile(workbook, `${filePath}/${fileName}`);

        downloadPathList.push(downloadPath);
      }),
    );

    return '';
  }

  async downloadMealBalanceExcel({ year, month }: DownloadMealBalanceDto): Promise<string> {
    const host = this.configService.get<string>('SERVER_URL');
    const filePath = 'resource/download/meal';
    const fileName = `ACG_식대정산_Template_${year}년_${month}월.xlsx`;
    const downloadPath: string = `${host}/${filePath}/${fileName}`;

    /* 디렉토리 관리 */
    if (!fs.existsSync(filePath)) {
      // filePath 폴더가 존재하지 않을 시, 생성합니다.
      fs.mkdirSync(filePath, { recursive: true });
    } else if (fs.existsSync(`${filePath}/${fileName}`)) {
      // filePath 폴더에 fileName이 존재하면 기존 파일은 삭제합니다.
      fs.rmSync(`${filePath}/${fileName}`, { recursive: true });
    }

    /* 식대 내역 시트 */
    const mealStatsList: MealStatsAdminInfo[] = await this.downloadRepository.getMealStatsList(year, month);
    const xlsxData = mealStatsExcelAdminTemplate(mealStatsList);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(xlsxData);
    mealStatsExcelAdminDecorate(worksheet);
    XLSX.utils.book_append_sheet(workbook, worksheet, '정산내역');
    workbook.Props = {
      Title: 'ACG 식대정산 파일',
      Subject: `${year}년_${month}월_식대정산 파일`,
    };

    await XLSX.writeFile(workbook, `${filePath}/${fileName}`);

    return downloadPath;
  }
}
