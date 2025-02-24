import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { animate, motion, MotionValue, useAnimation, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

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
        duration: 2,
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
  const [rotation, setRotation] = useState(0);

  const dragDeltaX = useMotionValue(0);
  const rotationDesc = useTransform(dragDeltaX, [-20, 20], [-5, 5]);
  const deltaSensitivity = 0.5;
  
  // 스프링 설정
  const springDescConfig = { stiffness: 400, damping: 10 };
  const springDescRotation = useSpring(rotationDesc, springDescConfig);

  // 드래그 핸들러 추가0
  const handleDrag = useCallback((event, info) => {
    // 드래그 중에는 raw 값으로 업데이트
    const sensitivity = 30/200;
    setRotation(prev => prev + (info.delta.x * sensitivity));
    dragDeltaX.set(event.movementX * deltaSensitivity);
  }, [dragDeltaX]);

  // 드래그 종료 핸들러 추가
  const handleDragEnd = async () => {
    dragDeltaX.set(0);
    const targetAngle = calculateClosestAngle(rotation);
    
    // framer-motion의 animate 함수를 사용하여 부드러운 스냅 애니메이션
    await animate(rotation, targetAngle, {
      type: "spring",
      stiffness: 400,
      damping: 30,
      onUpdate: (latest) => {
        // requestAnimationFrame을 사용하여 렌더링 동기화
        requestAnimationFrame(() => {
          setRotation(latest);
          dragDeltaX.set(0);
        });
      }
    });
  };

  // 가장 가까운 카드의 각도 계산
  const calculateClosestAngle = (currentRotation) => {
    const cardAngle = 360 / skills.length;
    const targetIndex = Math.round(currentRotation / cardAngle);
    return targetIndex * cardAngle;
  };

  const skills = [
    { name: "Program Langauge", description: "활용할 수 있는 언어들입니다.\n프레임워크 및 기술을 포함합니다.", 
      footer: <ArrowRight className='w-4 h-4 text-white/60'/> },
    { name: "C", description: "STL, Java Native Interface\n멀티프로세싱/스레딩\nSIMD 최적화\nArduino, ARM",
      additionDesc:"Modul Pattern, Observer Pattern\nMemory Pool Pattern\n"},
    { name: "C++", description: "DLL, P/Invoke, OpenCL\nMutex, Semaphore\nAbstract, friends",
      additionDesc:"SmartPointer, Pimpl\nPerfect Forwarding" },
    { name: "C#", description: "WPF, WinForm, Xamarin, Unity3D\n",
      additionDesc:"MVVM Pattern\nDependency Injection\nExtension Methods" },
    { name: "Java", description: "Android, Android Library\nSpring Boot\n",
      additionDesc:"Singleton Pattern, Builder Pattern\nStrategy Pattern, Adapter Pattern\nThread Pool" },
    { name: "Python", description: "TensorFlow, PyTorch\nmatplotlib\n",
      additionDesc:"Context Manager" },
    { name: "JavaScript", description: "React, RESTful API\n",
      additionDesc:"Promise Pattern, Closures" },
    { name: "Matlab", description: "신호 처리, 필터 설계\nParallel Computing\n데이터 분석 및 시각화\n"},
    { name: "Rust", description: "문법 학습 중..." },
  ];

  // 카드 위치 계산 - useCallback으로 캐싱
  const calculateCardStyle = (angle, y) => {
    const rad = Math.PI / 180;
    const deg2rad = angle * rad;
    const x = radius * Math.sin(deg2rad);
    const cos = radius * Math.cos(deg2rad);
    const zIndex = Math.round(1000 + cos);
    const opacity = (cos + radius) / (radius * 2);
    const z = cos - radius/2;

    return [{
      transform: `
        translate3d(${x}px, ${-y}px, ${z}px)
        rotateY(${angle}deg)
      `,
      transformStyle: 'preserve-3d',
      zIndex,
      opacity
    }, {
      x: x,
      y,
      z: z,
      rotateY: angle,
      transformStyle: 'preserve-3d',
      zIndex,
      opacity
    }]
  };

  // 반지름 계산 - useMemo로 캐싱
  const radius = useMemo(() => {
    const cardWidth = 300; // 카드 너비
    const cardSpacing = 50; // 카드 사이 최소 간격    
    // 원의 둘레 = 2πr
    // 필요한 둘레 = (카드 너비 + 간격) * 카드 개수
    // 따라서 r = (카드 너비 + 간격) * 카드 개수 / (2π)
    const minRadius = (cardWidth + cardSpacing) * skills.length / (2 * Math.PI);
    // 여유 공간을 위해 10% 정도 더 큰 반지름 사용
    return Math.max(600, Math.ceil(minRadius * 1.1));
  }, [skills.length]);

  // 회전 계산 - useMemo로 캐싱
  const rotations = useMemo(() => {
    return skills.map((_, index) => (index * (360 / skills.length)))
  }, []);

  const memoizedCardStyles = useMemo(() => {
    return skills.map((_, index) => {
      const angle = rotations[index] + rotation;
      return calculateCardStyle(angle, 108);
    });
  }, [rotation, rotations, calculateCardStyle]);

  return (
    <div className="w-dvw h-[600px] relative"
      style={{ perspective: `${radius * 3}px` }}>
      <div className="absolute w-full h-full flex items-center justify-center"
      style={{
        transformStyle: 'preserve-3d', // 3D 공간 보존
        userSelect:"none"
      }}>
        {skills.map((skill, index) => {
          const [mainStyle, addStyle] = memoizedCardStyles[index];

          return (<>
            <div
              key={`main-${skill.name}`}
              style={mainStyle}
              className="card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-[300px] h-[200px] bg-white/10 rounded-xl p-6" >
              <h3 className="text-2xl font-bold text-white mb-4">{skill.name}</h3>
              <p className="text-white/80 whitespace-pre-line">{skill.description}</p>
              {/* Footer 영역 */}
              {skill.footer && (
                <div className="absolute bottom-1 w-[252px] pb-5 border-white/10 flex items-center justify-end">
                  <span className="text-sm text-white/60">{skill.footer}</span>
                </div>
              )}
            </div>
            {skill.additionDesc ? (
              <motion.div
                key={`addition-${skill.name}`}
                animate={addStyle}
                transition={{
                  type: "tween",
                  duration: 0.02,
                  ease: 'linear',
                }}
                className='card'>
                <motion.div
                  style={{
                    rotate:springDescRotation,
                  }}
                  className="card absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                            w-[300px] h-[200px] bg-white/10 backdrop-blur-sm rounded-xl p-6"
                >
                  <p className="text-white/80 whitespace-pre-line">{skill.additionDesc}</p>
                </motion.div>
              </motion.div>
            ) : null}
          </>
          )
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