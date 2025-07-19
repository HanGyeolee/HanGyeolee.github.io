import React, { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { GradientConfig, NavigationProps, SectionProps } from '../util/sections.ts';
import FloatingBottle from '../animations/floatingBottle.tsx';
import useDeviceDetection from '../util/MobileHook.ts';

// 기본 섹션 정의
const defaultSections: SectionProps[] = [
  { id: 'start', invisible: true },
  { id: 'intro', label: '짧은 소개' },
  { id: 'about', label: '자기 소개' },
  { id: 'skills', label: '기술 스택' },
  { id: 'projects', label: '프로젝트' }
];

const Navigation = (props:NavigationProps) => {
  const { isDesktop } = useDeviceDetection();
    // 섹션 정의
  const sections = props.sections || defaultSections;

  const colors = useRef<string[]>(props.sections?.flatMap(item=>item.colors ?? []).filter(Boolean) ?? [])
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const bottleInitialize = useRef<boolean>(false);
  const bottleRef = useRef<HTMLDivElement|null>(null)

  // 스크롤 위치에 따라 활성 섹션 업데이트
  useEffect(() => {
    const updateActiveSection = () => {
      let currentSection = sections[0].id;
      let title = sections[0]?.title ? sections[0]?.title : props?.defaultTitle; 
      
      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 1) {
            currentSection = section.id;
            title = section?.title ? section?.title : props?.defaultTitle;
          }
        }
      });
      
      // 내부에서 이미 애니메이션 중이면 즉시 return;
      setActiveSection(currentSection);
      if(title){
        document.title = title;
      }
    };

    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection(); // 초기 로딩 시 실행
    
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
    };
  }, [props.sections, sections]);

  useEffect(() => {
    if(!bottleInitialize.current) {
      if(bottleRef.current && activeSection !== sections[0].id){
        bottleInitialize.current = true;
        gsap.to(bottleRef.current, 
          {
          x: "0%",
          duration: 8.0,
          ease: "power2.out",
        });
      }
    }
  }, [activeSection, bottleRef])

  // 섹션으로 스크롤
  const scrollToSection = useCallback((id: string) => {
    const section = document.getElementById(id);
    if (section) {
      // 섹션의 높이를 구해서 하단 위치 계산
      const sectionHeight = section.getBoundingClientRect().height;
      const sectionTop = section.offsetTop;
      const windowHeight = window.innerHeight;
      
      // 스크롤 위치 계산: 섹션 상단 + 섹션 높이 - 화면 높이
      // 이렇게 하면 섹션의 하단이 화면 하단에 위치하게 됨
      const scrollPosition = sectionTop + sectionHeight - windowHeight;
      
      gsap.to(window, {
        duration: 2,
        scrollTo: {
          y: scrollPosition,
          offsetY: 0
        },
        ease: "none"
      });
    }
  }, []);

  // 다음 또는 이전 섹션으로 이동하는 함수
  const navigateToSection = useCallback((direction: 'next' | 'prev') => {
    const currentIndex = sections.findIndex(section => section.id === activeSection);
    let newIndex;
    
    if (direction === 'next') {
      newIndex = currentIndex < sections.length - 1 ? currentIndex + 1 : currentIndex;
    } else {
      newIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
    }

    if (newIndex !== currentIndex) {
      scrollToSection(sections[newIndex].id);
    }
  }, [activeSection, sections, scrollToSection]);
  
  // 키보드 이벤트 처리
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서 키 이벤트가 발생한 경우 처리하지 않음
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // 방향키 처리
      if (e.key === 'ArrowDown') {
        e.preventDefault(); // 기본 스크롤 동작 방지
        navigateToSection('next');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault(); // 기본 스크롤 동작 방지
        navigateToSection('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigateToSection]);

  return (
  <>
    <div className="fixed left-full bottom-0 transform -translate-x-1/2 pb-4 pr-4 text-xs text-white whitespace-nowrap md:block sm:none z-50">
      <kbd className="px-1 py-0.5 bg-black/30 rounded">↑</kbd>
      <kbd className="px-1 py-0.5 bg-black/30 rounded ml-1">↓</kbd>
      <span className="ml-1 mix-blend-difference isolate">키로 이동</span>
    </div>
    <nav className="fixed right-3 top-1/2 transform -translate-y-1/2 z-50">
      <ul className="flex flex-col gap-4">
        {sections.filter((section) => section.invisible !== true).map((section) => (
          <li key={section.id} className="relative group">
            <div className='flex flex-row-reverse items-center'>
              <button
                onClick={() => scrollToSection(section.id)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeSection === section.id 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`${section.label} 섹션으로 이동`}
              />
              
              {/* 툴팁 */}
              <span className="mr-4 text-white text-sm whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 bg-black px-2 py-1 rounded">
                {section.label}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </nav>
    {
      isDesktop?
      <div ref={bottleRef} className="fixed w-full h-full z-70 pointer-events-none" style={{
          transform:"translateX(-30%)" ,willChange:"transform"
      }}>
        <FloatingBottle
          onContactDialogOpen={() => {}}
          onContactDialogClose={() => {}}
          backgroundGradient={{
            colors:colors.current,
            type:"linear"
          }}
        />
      </div>:null
    }
  </>
  );
};

export {Navigation};