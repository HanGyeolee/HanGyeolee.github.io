import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { animate, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

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

const SkillsCarousel = () => {
  // 모션 값 설정
  const dragX = useMotionValue(0);
  const rotation = useTransform(dragX, [-200, 200], [30, -30]);
  const dragDeltaX = useMotionValue(0);
  const rotationDesc = useTransform(dragDeltaX, [-20, 20], [-10, 10]);
  
  // 스프링 설정
  const springConfig = { stiffness: 400, damping: 30 };
  const springRotation = useSpring(rotation, springConfig);
  const springDescConfig = { stiffness: 200, damping: 10 };
  const springDescRotation = useSpring(rotationDesc, springDescConfig);

  const skills = [
    { name: "Program Langauge", description: "활용할 수 있는 언어들입니다.\n프레임워크 및 기술을 포함합니다.", 
      footer: <ArrowRight className='w-4 h-4 text-white/60'/> },
    { name: "C", description: "STL, Java Native Interface\n멀티프로세싱/스레딩\nSIMD 최적화\nArduino, ARM",
      additionDesc:"Modul Pattern, Observer Pattern\nMemory Pool Pattern\n"},
    { name: "C++", description: "DLL, P/Invoke, OpenCL\nMutex, Semaphore\nAbstract, friends",
      additionDesc:"SmartPointer, Pimpl\nPerfect Forwarding" },
    { name: "C#", description: "WPF, WinForm, Xamarin, Unity3D\n",
      additionDesc:"MVVM Pattern, Dependency Injection\nExtension Methods" },
    { name: "Java", description: "Android, Android Library\nSpring Boot\n",
      additionDesc:"Singleton Pattern, Builder Pattern\nStrategy Pattern, Adapter Pattern\nThread Pool" },
    { name: "Python", description: "TensorFlow, PyTorch\nmatplotlib\n",
      additionDesc:"Context Manager" },
    { name: "JavaScript", description: "React, RESTful API\n",
      additionDesc:"Promise Pattern, Closures" },
    { name: "Matlab", description: "Parallel Computing\n데이터 분석 및 시각화\n"},
    { name: "Rust", description: "문법 학습 중..." },
  ];

  // 반지름 계산 - useMemo로 캐싱
  const radius = useMemo(() => {
    const cardWidth = 300;
    const cardSpacing = 50;
    const minRadius = (cardWidth + cardSpacing) * skills.length / (2 * Math.PI);
    return Math.max(600, Math.ceil(minRadius * 1.1));
  }, [skills.length]);

  // 카드 위치 계산 - useCallback으로 캐싱
  const calculateMainCardStyle = useCallback((index) => {
    const angle = (index * (360 / skills.length)) + springRotation.getPrevious();
    const deg2rad = angle * Math.PI / 180;
    const z = radius * Math.cos(deg2rad);
    const zIndex = Math.round(1000 + z);
    const opacity = (z + radius) / (radius * 2);

    if (opacity > 0.05) {
      return {
        position: 'absolute',
        left: '50%',
        top: '50%',
        x: radius * Math.sin(deg2rad),
        y: -108,
        z: z - radius/2,
        rotateY: angle,
        translateX: '-50%',
        translateY: '-50%',
        zIndex,
        opacity
      }
    }  
    return { visibility: "hidden" };
  }, [radius, skills.length, springRotation]);

  const calculateAdditionCardStyle = useCallback((index) => {
    const angle = (index * (360 / skills.length)) + springDescRotation.getPrevious();
    const deg2rad = angle * Math.PI / 180;
    const z = radius * Math.cos(deg2rad);
    const zIndex = Math.round(1000 + z);
    const opacity = (z + radius) / (radius * 2);
    return {
      position: 'absolute',
      left: '50%',
      top: '50%',
      x: radius * Math.sin(deg2rad),
      y: 108,
      z: z - radius/2,
      rotateY: angle,
      translateX: '-50%',
      translateY: '-50%',
      zIndex,
      opacity
    }
  }, [radius, skills.length, springDescRotation]);

  // 메인 카드 렌더링
  const MainCards = useCallback(() => {
    return <>
      {skills.map((skill, index) => (
        <motion.div
          key={skill.name}
          style={{
            ...calculateMainCardStyle(index),
            transform:springRotation,
          }}
          layoutId={`main-${skill.name}`}
        >
          <div className='w-[300px] h-[200px] bg-white/15 backdrop-blur-sm rounded-xl p-6'>
            <h3 className="text-2xl font-bold text-white mb-4">{skill.name}</h3>
            <p className="text-white/80 whitespace-pre-line">{skill.description}</p>
            {/* Footer 영역 */}
            {skill.footer && (
              <div className="absolute bottom-1 w-[252px] pb-5 border-white/10 flex items-center justify-end">
                <span className="text-sm text-white/60">{skill.footer}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </>
  }, [calculateMainCardStyle, springRotation]);
  
  // 추가 카드 렌더링
  const AdditionCards = useCallback(() => {
    return (<>
      {skills.map((skill, index) => 
        skill.additionDesc ? (
          <motion.div
            key={`${skill.name}-addition`}
            style={{
              ...calculateAdditionCardStyle(index),
              rotate:springDescRotation,
            }}
            layoutId={`addition-${skill.name}`}
          >
            <div className='w-[300px] h-[200px] bg-white/15 backdrop-blur-sm rounded-xl p-6'>
              <p className="text-white/80 whitespace-pre-line">{skill.additionDesc}</p>
            </div>
          </motion.div>
        ) : null
      )}
    </>)
  }, [calculateAdditionCardStyle, springDescRotation]);

  return (
    <div className="w-dvw h-[600px] relative"
      style={{ perspective: `${radius * 3}px` }}>
      <div className="absolute w-full h-full flex items-center justify-center"
      style={{
        transformStyle: 'preserve-3d', // 3D 공간 보존
        userSelect:"none"
      }}>
        <MainCards />
        <AdditionCards />
      </div>
      
      {/* 드래그 가능한 투명한 영역 */}
      <motion.div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={() => {
          dragX.set(0);
          dragDeltaX.set(0);
        }}
        onDrag={(event) => {
          dragDeltaX.set(event.movementX);
        }}
        style={{ x:dragX, touchAction: 'none', zIndex:10000 }}
      />
    </div>
  );
};

export default SkillsSection;