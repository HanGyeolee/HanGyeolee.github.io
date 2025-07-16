import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

const ScrollIndicator = ({ color = "white" }) => {
  return (
    <div className="fixed bottom-8 left-1/2 transform inline-flex flex-col items-center">
      <p className={`text-xs tracking-widest text-${color}/80 mt-2 animate-bounce`}>스크롤</p>
      <div className={`flex flex-col items-center text-${color}/80 animate-bounce`}>
        <ChevronDown className={`w-6 h-6 text-${color}/80`} />
      </div>
    </div>
  );
};

// 1. Intersection Observer를 사용한 커스텀 Hook
const useInViewport = (options?: IntersectionObserverInit) => {
  const [isInViewport, setIsInViewport] = useState(false);
  const [isObserved, setIsObserved] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
        if (entry.isIntersecting && !isObserved) {
          setIsObserved(true);
        }
      },
      {
        // 기본 옵션: 요소가 10% 이상 보일 때 감지
        threshold: 0.1,
        // 루트 마진: 화면 경계에서 100px 전에 미리 로딩
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [isObserved, options]);

  return { elementRef, isInViewport, isObserved };
};


// 2. 지연 로딩 컴포넌트
interface LazyComponentProps {
  children: React.ReactNode;
  height?: number;
  placeholder?: React.ReactNode;
  unloadWhenHidden?: boolean;
}

const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  height = 200,
  placeholder,
  unloadWhenHidden = false,
}) => {
  const { elementRef, isInViewport, isObserved } = useInViewport();

  // unloadWhenHidden이 true면 뷰포트에서 벗어날 때 언로드
  // false면 한 번 로드된 후 유지
  const shouldRender = unloadWhenHidden ? isInViewport : isObserved;

  return (
    <div
      ref={elementRef}
      style={{
        minHeight: height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {shouldRender ? (
        children
      ) : (
        placeholder || (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            color: '#666'
          }}>
            Loading...
          </div>
        )
      )}
    </div>
  );
};


export {ScrollIndicator, useInViewport};