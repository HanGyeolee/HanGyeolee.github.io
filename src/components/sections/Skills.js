import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { animate, motion, useMotionValue } from 'framer-motion';

const SkillsSection = () => {
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
          scrub: 1.5,
          markers: true,
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
      .from(".about-skills", {
        y: 200,
        opacity: 0,
        duration: 0.5
      }, "-=0.3")
      .from(".nothing", {
        opacity: 0,
        duration: 3,
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);
  return (
    <div ref={sectionRef} className="h-dvh bg-[#1B365D] flex flex-col items-center justify-center relative overflow-hidden">
      {/* 배경 그라데이션 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1B365D] to-[#0F2342]"></div>

      <div className="section-content text-center z-10 mx-auto px-4">
        <h1 className="section-title text-7xl text-white mb-6 max-w-5xl mx-auto">
          <span className="title-header">이런&nbsp;</span>
          <span ref={highlightRef} className='font-bold'>스킬</span>
          <span className="title-header">이 있습니다.</span>
        </h1>
        <div className="space-y-8 text-left about-skills">
          <SkillsCarousel/>
        </div>
        <div className='nothing'></div>
      </div>

      {/* 스크롤 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/50 animate-bounce">
        <p className="text-sm tracking-widest">SCROLL</p>
      </div>
    </div>
  );
};

const SkillsCarousel = ({ className }) => {
  const dragX = useMotionValue(0);
  const [rotation, setRotation] = useState(0);

  const skills = [
    { name: "C/C++", description: "STL, 멀티프로세싱/스레딩, SIMD 최적화" },
    { name: "C#", description: "WPF, WinForm, Xamarin, Unity3D" },
    { name: "Java", description: "Android, Android Library, Spring Boot" },
    { name: "Python", description: "머신러닝, TensorFlow, PyTorch" },
    { name: "Matlab", description: "데이터 분석 및 시각화, Parallel Computing" },
    { name: "JavaScript", description: "React, RESTful API" },
    { name: "Rust", description: "시스템 프로그래밍" }
  ];

  // 원통의 반지름을 동적으로 계산
  const calculateRadius = () => {
    const cardWidth = 300; // 카드 너비
    const cardSpacing = 50; // 카드 사이 최소 간격
    const numCards = skills.length;
    
    // 원의 둘레 = 2πr
    // 필요한 둘레 = (카드 너비 + 간격) * 카드 개수
    // 따라서 r = (카드 너비 + 간격) * 카드 개수 / (2π)
    const minRadius = (cardWidth + cardSpacing) * numCards / (2 * Math.PI);
    
    // 여유 공간을 위해 20% 정도 더 큰 반지름 사용
    return Math.max(600, Math.ceil(minRadius * 1.1));
  };

  const radius = calculateRadius();

  // 드래그 값을 회전 각도로 변환
  const handleDrag = (event, info) => {
    // 드래그 중에는 raw 값으로 업데이트
    setRotation(prev => prev + info.delta.x * 0.25);
  };

  const calculateCardTransform = (angle) => {
    const radius = calculateRadius();
    
    const x = radius * Math.sin(angle * Math.PI / 180);
    const z = radius * Math.cos(angle * Math.PI / 180);
    
    // 카드 개수에 따라 scale 범위도 조정
    const minScale = Math.max(0.3, 1 - (skills.length / 20)); // 카드가 많을수록 작아지는 최소 크기
    
    const zIndex = Math.round(1000 + z);
    
    return {
      transform: `
        translate3d(${x}px, 0, ${z - radius/2}px)
        rotateY(${angle}deg)
      `,
      transformStyle: 'preserve-3d',
      zIndex,
      opacity: (z + radius) / (radius * 2)
    };
  };

  // 가장 가까운 카드의 각도 계산
  const calculateClosestAngle = (currentRotation) => {
    const cardAngle = 360 / skills.length;
    const targetIndex = Math.round(currentRotation / cardAngle);
    return targetIndex * cardAngle;
  };

  // 드래그 종료 핸들러 추가
  const handleDragEnd = () => {
    const targetAngle = calculateClosestAngle(rotation);
    
    // framer-motion의 animate 함수를 사용하여 부드러운 스냅 애니메이션
    animate(rotation, targetAngle, {
      type: "spring",
      stiffness: 150,
      damping: 20,
      onUpdate: (latest) => setRotation(latest)
    });
  };

  // perspective도 반지름에 따라 동적 계산
  const calculatePerspective = () => {
    const radius = calculateRadius();
    return `${radius * 3}px`; // 반지름의 3배 정도로 설정
  };

  return (
    <div className="w-dvw h-[600px] relative"
      style={{ perspective: calculatePerspective() }}>
      <div className="absolute w-full h-full flex items-center justify-center"
      style={{
        transformStyle: 'preserve-3d', // 3D 공간 보존
        userSelect:"none"
      }}>
        {skills.map((skill, index) => {
          const angle = (index * (360 / skills.length)) + rotation;
            const style = calculateCardTransform(angle);

          return (
            <motion.div
              key={skill.name}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[300px] h-[200px] bg-white/10 backdrop-blur-sm rounded-xl p-6"
              style={style}
            >
              <h3 className="text-2xl font-bold text-white mb-4">{skill.name}</h3>
              <p className="text-white/80">{skill.description}</p>
            </motion.div>
          );
        })}
      </div>
      
      {/* 드래그 가능한 투명한 영역 */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        style={{ touchAction: 'none', zIndex:10000 }}
      />
    </div>
  );
};

export default SkillsSection;