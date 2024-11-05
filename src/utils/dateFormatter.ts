export const formatDate = (date: string | number | Date | null): string => {
  if (!date) return '-';
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 유효한 날짜인지 확인
    if (isNaN(dateObj.getTime())) {
      return '-';
    }

    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(dateObj);
  } catch (error) {
    console.error('날짜 포맷 에러:', error);
    return '-';
  }
}; 

export const formatDateTime = (date: string | number | Date | null): string => {
    if (!date) return '-';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      
      // 유효한 날짜인지 확인
      if (isNaN(dateObj.getTime())) {
        return '-';
      }
  
      return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(dateObj);
    } catch (error) {
      console.error('날짜 포맷 에러:', error);
      return '-';
    }
  }; 