import React, {useEffect, useState} from 'react';

// 타입 정의
export type TitleMap = Record<string, string>;

/**
 * 브라우저 언어에 따라 자동으로 document.title을 설정하는 함수
 * @param titles - 언어코드를 키로 하는 제목 객체 (예: { ko: '한국어 제목', en: 'English Title' })
 * @param fallbackLanguage - 기본 언어 (기본값: 'en')
 */
const setDocumentTitleByLanguage = (titles: TitleMap, fallbackLanguage: string = 'en') => {
  // 브라우저 언어 감지 (예: 'ko-KR' -> 'ko')
  const browserLanguage = navigator.language.split('-')[0];
  
  // 해당 언어의 제목이 있으면 사용, 없으면 fallback 언어 사용
  const title = titles[browserLanguage] || titles[fallbackLanguage] || Object.values(titles)[0];
  
  if (title) {
    document.title = title;
  }

  return {
    detectedLanguage: browserLanguage,
    appliedTitle: title
  };
};

/**
 * React Hook: 브라우저 언어 변경을 감지하고 자동으로 document.title 업데이트
 * @param titles - 언어코드를 키로 하는 제목 객체
 * @param fallbackLanguage - 기본 언어
 */
export const useAutoDocumentTitle = (titles: TitleMap, fallbackLanguage: string = 'ko') => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('');
  const [appliedTitle, setAppliedTitle] = useState<string>('');

  useEffect(() => {
    // 초기 설정
    const updateTitle = () => {
      const result = setDocumentTitleByLanguage(titles, fallbackLanguage);
      setCurrentLanguage(result.detectedLanguage);
      setAppliedTitle(result.appliedTitle);
    };

    updateTitle();

    // 언어 변경 감지 (window.onlanguagechange 이벤트)
    const handleLanguageChange = () => {
      updateTitle();
    };

    window.addEventListener('languagechange', handleLanguageChange);

    // cleanup
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [titles, fallbackLanguage]);

  return {
    detectedLanguage: currentLanguage,
    appliedTitle: appliedTitle
  };
};