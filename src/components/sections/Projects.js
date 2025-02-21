import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const ProjectsSection = () => {
  const sectionRef = useRef(null);
  const highlightRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1.5
        }
      });

      // 애니메이션 시퀀스
      tl.from(".title-header", {
        y: 50,
        opacity: 0,
        duration: 1
      })
      .from(highlightRef.current, {
        y: -50,
        opacity: 0,
        duration: 1
      }, "<")
      .from(".about-projects", {
        scale: 0.75,
        opacity: 0,
        stagger: 0.5,
        duration: 1
      }, "-=0.3")
      .from(".nothing", {
        opacity: 0,
        duration: 2,
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-dvh bg-[#1B365D] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0F2342] to-[#061529]"></div>

      <div className="section-content text-center z-10 max-w-4xl mx-auto px-4">
        <h1 className="section-title text-7xl text-white mb-6">
          <span className="title-header">이런&nbsp;</span>
          <span ref={highlightRef} className='font-bold'>프로젝트</span>
          <span className="title-header">를 했습니다.</span>
        </h1>


        <div className='nothing'></div>
      </div>

      {/* 스크롤 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
        <p className="text-sm tracking-widest">SCROLL</p>
      </div>
    </div>
  );
};

export default ProjectsSection;