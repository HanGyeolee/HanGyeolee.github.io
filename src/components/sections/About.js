import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ResponsiveContainer } from '../ui';

const AboutSection = () => {
  const sectionRef = useRef(null);

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
      .from(".title-header-highlight", {
        y: -50,
        opacity: 0,
        duration: 1
      }, "<")
      .from(".about-quote", {
        scale: 0.75,
        opacity: 0,
        stagger: 0.5,
        duration: 1
      }, "-=0.3")
      .from(".about-paragraph", {
        y: 30,
        opacity: 0,
        stagger: 0.5,
        duration: 1
      }, "-=0.5")
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#66A5AD] to-[#1B365D]"></div>

      {/* 메인 컨텐츠 */}
      <ResponsiveContainer>
        <div className="section-content text-center z-10 max-w-5xl mx-auto px-4">
          <h1 className="section-title text-7xl text-white mb-6">
            <span className="title-header">저는&nbsp;</span>
            <span className='title-header-highlight font-bold'>개발자</span>
            <span className="title-header">입니다.</span>
          </h1>
          
          <div className="space-y-8 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="about-quote border-l-4 border-white/30 pl-6 my-8">
                <p className="text-white/90 italic text-lg">
                  "열정으로 쓰는 코드,
                </p>
                <p className="text-white/90 italic text-lg text-center">
                  책임으로 마주하는 오류"
                </p>
                <p className="text-gray-300 mt-2">
                  - 저의 개발 철학입니다
                </p>
              </div>
              <div className="about-quote border-l-4 border-white/30 pl-6 my-8">
                <p className="text-white/80 italic text-lg">
                  "신선한 아이디어는 새싹처럼,
                </p>
                <p className="text-white/80 italic text-lg text-center">
                  깊은 통찰은 뿌리처럼"
                </p>
                <p className="text-gray-300 mt-2">
                  - 끊임없는 배움의 자세로 임합니다
                </p>
              </div>
            </div>
            
            <p className="about-paragraph text-gray-200 text-lg leading-relaxed">
              대학 연구실에서 시작된 <span className="text-white font-semibold">생체신호 처리</span>에 대한 관심은 
              현재 의료 헬스케어 플랫폼 개발로 이어졌습니다. 논문 속 알고리즘을 실제 서비스에 최적화하는 과정에서,
              기술적 도전을 즐기며 성장해왔습니다.
            </p>

            <p className="about-paragraph text-gray-200 text-lg leading-relaxed">
              <span className="text-white font-semibold">멀티스레딩과 SIMD</span>를 활용한 성능 최적화부터,
              <span className="text-white font-semibold">Android, Windows, iOS</span> 플랫폼 개발까지.
              다양한 기술 스택을 활용하여 최적의 솔루션을 만들어내는 것을 좋아합니다.
            </p>

            <p className="about-paragraph text-gray-200 text-lg leading-relaxed">
              팀 리더로서 <span className="text-white font-semibold">적극적인 소통과 협업</span>을 통해 
              더 나은 서비스를 만들어가는 것을 중요하게 생각합니다. Github Action을 활용한 CI/CD 환경 구축,
              코드 리뷰 문화 정착 등 팀의 개발 문화를 발전시키는 데도 기여하고 있습니다.
            </p>
          </div>

          <div className='nothing'></div>
        </div>
      </ResponsiveContainer>

      {/* 스크롤 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
        <p className="text-sm tracking-widest">SCROLL</p>
      </div>
    </div>
  );
};

export default AboutSection;