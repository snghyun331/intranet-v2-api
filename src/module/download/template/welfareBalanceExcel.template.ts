import * as XLSX from 'xlsx-js-style';
import { ClearStatusEnum } from '../../../common/constant/enum';

export const welfareStatsExcelAdminTemplate = (welfareStatsList: any) => {
  /* 셀 스타일 */
  // 카테고리-텍스트 style
  const category_text_style = {
    font: { name: '나눔스퀘어', sz: 12, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    fill: { fgColor: { rgb: 'f4f4f4' } },
  };
  // 내용 텍스트 style
  const content_text_style = {
    font: { name: '나눔스퀘어', sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  /* row 데이터 */
  const row1 = [
    {
      v: 'No.',
      t: 's',
      s: {
        font: { name: '나눔스퀘어', sz: 12, bold: true },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'medium' },
          bottom: { style: 'thin' },
          left: { style: 'medium' },
          right: { style: 'thin' },
        },
        fill: { fgColor: { rgb: 'f4f4f4' } },
      },
    },
    { v: '직급', t: 's', s: category_text_style },
    { v: '성명', t: 's', s: category_text_style },
    { v: '총 금액', t: 's', s: category_text_style },
    { v: '사용 금액', t: 's', s: category_text_style },
    { v: '잔액', t: 's', s: category_text_style },
    { v: '정산여부', t: 's', s: category_text_style },
    { v: '정산금액', t: 's', s: category_text_style },
    {
      v: '비고',
      t: 's',
      s: {
        font: { name: '나눔스퀘어', sz: 11, bold: true },
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'medium' },
          bottom: { style: 'thin' },
          left: { style: 'thin' },
          right: { style: 'medium' },
        },
        fill: { fgColor: { rgb: 'f4f4f4' } },
      },
    },
  ];

  const dataRow = welfareStatsList.map((welfareStats, idx) => {
    return [
      {
        v: `${idx + 1}`,
        t: 's',
        s: {
          font: { name: '나눔스퀘어', sz: 10 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'medium' },
            right: { style: 'thin' },
          },
        },
      },
      {
        v: `${welfareStats.gradeName === null ? '-' : welfareStats.gradeName}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.userName === null ? '-' : welfareStats.userName}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.welfareBudget === null ? '-' : welfareStats.welfareBudget}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.welfareExpense === null ? '-' : welfareStats.welfareExpense}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.welfareBalance === null ? '-' : welfareStats.welfareBalance}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.clearStatus === null ? '-' : welfareStats.clearStatus === ClearStatusEnum.NOT_YET ? '미정산' : '정산완료'}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.totalOverpay === null ? '-' : welfareStats.totalOverpay}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${welfareStats.note === null ? '-' : welfareStats.note}`,
        t: 's',
        s: {
          font: { name: '나눔스퀘어', sz: 10 },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin' },
            bottom: { style: 'thin' },
            left: { style: 'thin' },
            right: { style: 'medium' },
          },
        },
      },
    ];
  });

  return [row1, ...dataRow];
};

export const welfareStatsExcelAdminDecorate = (worksheet: XLSX.WorkSheet): XLSX.WorkSheet => {
  worksheet['!cols'] = [
    { wch: 9 }, // NO
    { wch: 15 }, // 직급
    { wch: 17 }, // 성명
    { wch: 18 }, // 총 금액
    { wch: 18 }, // 사용금액(중식)
    { wch: 18 }, // 잔액
    { wch: 13 }, // 정산여부
    { wch: 18 }, // 정산금액
    { wch: 35 }, // 비고
  ];
  worksheet['!rows'] = [{ hpt: 23 }];

  worksheet['!autofilter'] = { ref: 'A1:I2' };

  return worksheet;
};
