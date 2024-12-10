export const mealExcelAdminTemplate = (mealList) => {
  /* 셀 스타일 */
  // 카테고리-텍스트 style
  const field_style = {
    font: { name: '나눔스퀘어', sz: 11, bold: true },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    },
    fill: { fgColor: { rgb: 'E0E0E0' } },
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

  // 리스트-라스트-텍스트 style
  const list_last_text_style = {
    font: { name: '나눔스퀘어', sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: {
      top: { style: 'medium' },
    },
  };

  const row1 = [
    { v: '일자', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '근태', t: 's', s: field_style },
    { v: '중식내역', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '석식내역', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '조식내역', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
  ];
  const row2 = [
    { v: '연도', t: 's', s: field_style },
    { v: '월', t: 's', s: field_style },
    { v: '일', t: 's', s: field_style },
    { v: '요일', t: 's', s: field_style },
    { v: '업무일 구분', t: 's', s: field_style },
    { v: '특이 사항', t: 's', s: field_style },
    { v: '', t: 's', s: field_style },
    { v: '상호명', t: 's', s: field_style },
    { v: '금액', t: 's', s: field_style },
    { v: '비고', t: 's', s: field_style },
    { v: '상호명', t: 's', s: field_style },
    { v: '금액', t: 's', s: field_style },
    { v: '비고', t: 's', s: field_style },
    { v: '상호명', t: 's', s: field_style },
    { v: '금액', t: 's', s: field_style },
    { v: '비고', t: 's', s: field_style },
  ];

  return [row1, row2];
};

export const mealExcelAdminDecorate = (worksheet) => {
  worksheet['!cols'] = [
    { wch: 10 }, // 연도
    { wch: 10 }, // 월
    { wch: 10 }, // 일
    { wch: 8 }, // 요일
    { wch: 14 }, // 업무일 구분
    { wch: 14 }, // 특이사항
    { wch: 12 }, // 근태
    { wch: 30 }, // 상호명(중식)
    { wch: 14 }, // 금액(중식)
    { wch: 20 }, // 비고
    { wch: 30 }, // 상호명(석식)
    { wch: 14 }, // 금액(석식)
    { wch: 20 }, // 비고
    { wch: 30 }, // 상호명(조식)
    { wch: 14 }, // 금액(조식)
    { wch: 20 }, // 비고
  ];
  worksheet['!rows'] = [{ hpt: 23 }];

  worksheet['!merges'] = [
    { s: { c: 0, r: 0 }, e: { c: 5, r: 0 } },
    { s: { c: 6, r: 0 }, e: { c: 6, r: 1 } },
    { s: { c: 7, r: 0 }, e: { c: 9, r: 0 } },
    { s: { c: 10, r: 0 }, e: { c: 12, r: 0 } },
    { s: { c: 13, r: 0 }, e: { c: 15, r: 0 } },
  ];

  return worksheet;
};
