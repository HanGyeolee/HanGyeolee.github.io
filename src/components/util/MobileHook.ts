import { useState, useEffect } from 'react';

const useDeviceDetection = () => {
  const [isDesktop, setIsDesktop] = useState(false);

  const checkDevice = () => {
    // 1. 화면 크기 체크 (기본)
    const isLargeScreen = window.innerWidth >= 1024; // 태블릿보다 더 큰 화면
    
    // 2. 유저 에이전트 체크 (옵션)
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    
    // 3. 마우스/포인터 이벤트 지원 체크
    const hasMouseEvents = 'onmousemove' in window;
    
    // 조합된 조건으로 판단
    // 큰 화면 + 모바일 UA가 아님 + 마우스 이벤트 지원 = 데스크톱 환경 가능성↑
    setIsDesktop(isLargeScreen && !isMobileUA && hasMouseEvents);
  };

  useEffect(() => {
    // 초기 디바이스 체크
    checkDevice();

    // 화면 크기 변화 감지를 위한 이벤트 리스너
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);

    // 클린업 함수
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { isDesktop };
};

export default useDeviceDetection;