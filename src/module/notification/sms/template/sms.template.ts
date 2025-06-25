export const smsTemplate = (text: string): string => {
  const cleanedText = text
    .replace(/<\/p>/gi, '<br/>') // </p> -> <br/> 변환
    .replace(/<br\s*\/?>/gi, '\n') // <br/> -> \n 변환
    .replace(/<[^>]*>/g, ''); // 나머지 HTML 태그 제거

  const message: string = cleanedText;

  return message;
};
