import * as XLSX from 'xlsx-js-style';
import { ClearStatusEnum } from '../../../common/constant/enum';

export const mealStatsExcelAdminTemplate = (mealStatsList) => {
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
    { v: '사용가능금액(중식)', t: 's', s: category_text_style },
    { v: '사용금액', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '잔액', t: 's', s: category_text_style },
    { v: '정산여부', t: 's', s: category_text_style },
    { v: '총 정산금액', t: 's', s: category_text_style },
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

  const row2 = [
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '중식', t: 's', s: category_text_style },
    { v: '석식', t: 's', s: category_text_style },
    { v: '조식', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
    { v: '', t: 's', s: category_text_style },
  ];

  const dataRow = mealStatsList.map((mealStats, idx) => {
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
        v: `${mealStats.gradeName === null ? '-' : mealStats.gradeName}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.userName === null ? '-' : mealStats.userName}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.mealBudget === null ? '-' : mealStats.mealBudget}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.mealExpense === null ? '-' : mealStats.mealExpense}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.dinnerExpense === null ? '-' : mealStats.dinnerExpense}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.breakfastExpense === null ? '-' : mealStats.breakfastExpense}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.mealBalance === null ? '-' : mealStats.mealBalance}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.clearStatus === null ? '-' : mealStats.clearStatus === ClearStatusEnum.NOT_YET ? '미정산' : '정산완료'}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.totalOverpay === null ? '-' : mealStats.totalOverpay}`,
        t: 's',
        s: content_text_style,
      },
      {
        v: `${mealStats.note === null ? '-' : mealStats.note}`,
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

  return [row1, row2, ...dataRow];
};

export const mealStatsExcelAdminDecorate = (worksheet: XLSX.WorkSheet): XLSX.WorkSheet => {
  worksheet['!cols'] = [
    { wch: 9 }, // NO
    { wch: 15 }, // 직급
    { wch: 17 }, // 성명
    { wch: 18 }, // 사용가능금액
    { wch: 18 }, // 사용금액(중식)
    { wch: 18 }, // 사용금액(석식)
    { wch: 18 }, // 사용금액(조식)
    { wch: 18 }, // 잔액
    { wch: 13 }, // 정산여부
    { wch: 18 }, // 정산금액
    { wch: 35 }, // 비고
  ];
  worksheet['!rows'] = [{ hpt: 23 }];

  worksheet['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: 0, r: 1 } },
    { s: { c: 1, r: 0 }, e: { c: 1, r: 1 } },
    { s: { c: 2, r: 0 }, e: { c: 2, r: 1 } },
    { s: { c: 3, r: 0 }, e: { c: 3, r: 1 } },
    { s: { c: 4, r: 0 }, e: { c: 6, r: 0 } },
    { s: { c: 7, r: 0 }, e: { c: 7, r: 1 } },
    { s: { c: 8, r: 0 }, e: { c: 8, r: 1 } },
    { s: { c: 9, r: 0 }, e: { c: 9, r: 1 } },
    { s: { c: 10, r: 0 }, e: { c: 10, r: 1 } },
  ];

  worksheet['!autofilter'] = { ref: 'A2:J2' };

  return worksheet;
};
