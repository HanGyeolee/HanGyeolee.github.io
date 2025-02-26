import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Activity, Code2, Users, ScrollText, SearchCheck, Cpu } from 'lucide-react';
import {ResponsiveContainer} from '../ui'

const IntroSection = () => {
  const sectionRef = useRef(null);
  const subtitleRef = useRef(null);
  
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "+=300%",
          pin: true,
          scrub: 1.5,
          //markers: true, // 개발 시 마커 표시 (나중에 제거)
        }
      });

      // 애니메이션 시퀀스
      tl.from(".title-header", {
        y: 50,
        opacity: 0,
        duration: 1
      })
      .from(".title-header-highlight", {
        y: -50,
        opacity: 0,
        duration: 1
      }, "<")
      .from(subtitleRef.current, {
        y: 50,
        opacity: 0,
        duration: 1
      }, "-=0.5")
      .from(".highlight-left-item", {
        x: -50,
        opacity: 0,
        stagger: 0.3,
        duration: 0.8
      }, "-=0")
      .from(".highlight-right-item", {
        x: 50,
        opacity: 0,
        stagger: 0.3,
        duration: 0.8
      }, "-=0.5")
      .from(".nothing", {
        opacity:0,
        duration:2,
      })

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef} className="h-lvh bg-[#66A5AD] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#B2D8E5] to-[#66A5AD]"></div>
      {/* 메인 컨텐츠 */}
      <ResponsiveContainer>
        <div className="section-content text-center z-10 max-w-5xl mx-auto px-4">
          <h1 className="section-title text-7xl text-black mb-6">
              <span className="title-header">저는&nbsp;</span>
              <span className='title-header-highlight font-bold'>최한결</span>
              <span className="title-header">입니다.</span>
          </h1>
        
          <p ref={subtitleRef} className="text-xl text-darkgray-100 mb-12">
            혁신적인 솔루션을 만드는 개발자
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="highlight-left-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <Activity className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Signal Processing</h3>
              <p className="text-darkgray-100">실시간 신호 처리 및 알고리즘 최적화</p>
            </div>
            
            <div className="highlight-left-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <Cpu className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Optimizer</h3>
              <p className="text-darkgray-100">멀티프로세싱과 SIMD를 활용한 성능 최적화</p>
            </div>
            
            <div className="highlight-left-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <Users className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Technical Leader</h3>
              <p className="text-darkgray-100">개발팀 리드 및 프로젝트 관리 경험</p>
            </div>

            <div className="highlight-right-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <Code2 className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Multi Language</h3>
              <p className="text-darkgray-100">C/C++17, C#, Java, React, Python, Rust</p>
            </div>
            
            <div className="highlight-right-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <ScrollText className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Algorithm Developer</h3>
              <p className="text-darkgray-100">논문 기반 알고리즘 연구 및 구현</p>
            </div>
            
            <div className="highlight-right-item p-6 bg-white/30 rounded-lg backdrop-blur-sm">
              <div className="flex justify-center mb-4">
                <SearchCheck className="w-12 h-12 text-black" />
              </div>
              <h3 className="text-xl font-semibold text-black mb-3">Problem Solver</h3>
              <p className="text-darkgray-100">도전적인 기술 문제 해결</p>
            </div>
          </div>

          <div className='nothing'></div>
        </div>
      </ResponsiveContainer>
    </div>
  );
};

export default IntroSection;