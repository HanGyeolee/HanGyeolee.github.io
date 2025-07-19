import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import useDeviceDetection from '../util/MobileHook.ts';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import texturePaper  from '../../image/texture-paper.jpg';
import { ContactLinkProps } from '../util/projects.ts';
import { LinkedIn } from '../util/IconMapper.tsx';
import { Github } from 'lucide-react';
import { GradientConfig } from '../util/sections.ts';


interface FloatingBottleProps {
  onContactDialogOpen?: () => void;
  onContactDialogClose?: () => void;
  backgroundGradient?: GradientConfig; // 새로 추가
}

type AnimationState = 'idle' | 'opening' | 'closing' | 'completed';

// Canvas에 그라데이션을 그려서 환경맵 생성
const createGradientEnvironmentMap = (
  renderer: THREE.WebGLRenderer, 
  gradientConfig: GradientConfig
): THREE.Texture => {
  const size = 512;
  const colors = gradientConfig.colors;
  
  // 6개 면의 캔버스를 생성
  const createCanvas = (): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  };

  // 단색 면 생성 함수
  const createSolidFace = (color: string): HTMLCanvasElement => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  };

  // 그라데이션 면 생성 함수 (상단에서 하단으로)
  const createGradientFace = (): HTMLCanvasElement => {
    const canvas = createCanvas();
    const ctx = canvas.getContext('2d')!;
    
    // 위에서 아래로 Linear Gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, size);
    
    // 색상 스톱 추가
    const stops = gradientConfig.stops || colors.map((_, i) => i / (colors.length - 1));
    colors.forEach((color, index) => {
      gradient.addColorStop(stops[index], color);
    });
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    return canvas;
  };

  const side = createGradientFace()
  // 큐브맵 면들 생성
  // Three.js CubeTexture 순서: [positive-x, negative-x, positive-y, negative-y, positive-z, negative-z]
  // 즉: [right, left, top, bottom, front, back]
  const canvases: HTMLCanvasElement[] = [
    side, // positive-x (right) - 그라데이션
    side, // negative-x (left) - 그라데이션  
    createSolidFace(colors[0]), // positive-y (top) - 첫 번째 색상
    createSolidFace(colors[colors.length - 1]), // negative-y (bottom) - 마지막 색상
    side, // positive-z (front) - 그라데이션
    side  // negative-z (back) - 그라데이션
  ];

  // CubeTexture를 직접 생성 - 생성자에 이미지 배열 전달
  const cubeTexture = new THREE.CubeTexture(canvases);
  cubeTexture.needsUpdate = true;

  // PMREMGenerator로 환경맵 생성
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envMap = pmremGenerator.fromCubemap(cubeTexture).texture;
  
  // 리소스 정리
  pmremGenerator.dispose();
  cubeTexture.dispose();
  
  return envMap;
};

/**
 * 1. 스크롤 애니메이팅을 통해서 section 이동할 때마다, 메시지 병이 해류에 휩쓸려서 한 바퀴 빙글 돌게 할 거야.
 * 2. 메시지 병을 클릭하면 뚜껑이 '뽕' 열리면서 안에 있는 돌돌 말린 종이가 튀어 나와.
 * 3. 돌돌말린 종이가 펼쳐지면서 dialog 처럼 전체화면을 덮어. 여기서 fixed 로 설정하면 될 것 같아.
 * @param param0 
 * @returns 
 */
const FloatingBottle: React.FC<FloatingBottleProps> = ({ 
  onContactDialogOpen, 
  onContactDialogClose,
  backgroundGradient
}) => {
  const { isDesktop } = useDeviceDetection();
  const contactList = useRef<ContactLinkProps[]>([
    {
      title: "Github",
      href: "https://github.com/HanGyeolee",
      type: <Github className='w-[48px] h-[48px]'></Github>
    },
    {
      title: "LinkedIn",
      href: "https://www.linkedin.com/in/hangyeolee",
      type: <LinkedIn className='w-[48px] h-[48px]'></LinkedIn>
    }
  ])

  const createBottleFromGLB = useCallback(async (): Promise<{
    bottleGroup: THREE.Group;
    mixer: THREE.AnimationMixer;
    openAction: THREE.AnimationAction;
    closeAction: THREE.AnimationAction;
  }> => {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();

      // GLB 로드 후 매테리얼 확인 및 조정
      const setupMaterials = (bottleGroup: THREE.Group):THREE.Group => {
        bottleGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                const material = child.material as THREE.Material;
                
                // 유리병 재질 조정 (jackdaniel001)
                if (child.name === 'jackdaniel001') {
                  if (material instanceof THREE.MeshStandardMaterial) {
                    const newMaterial = new THREE.MeshPhysicalMaterial({
                      color: 0xffffff,
                      metalness: .9,
                      roughness: .125,
                      envMapIntensity: 0.9,
                      clearcoat: 1,
                      transparent: true,
                      // transmission: .95,
                      opacity: .25,
                      reflectivity: 0.5,
                      ior: 0.9,
                      side: THREE.BackSide,
                    });

                    // 할당 시도
                    child.material = newMaterial;
                    child.castShadow = false;
                  }
                }
                else if (child.name === 'inner001') {
                  if (material instanceof THREE.MeshStandardMaterial) {
                    const newMaterial = new THREE.MeshPhysicalMaterial({
                      color: 0xffffff,
                      metalness: .9,
                      roughness: .05,
                      envMapIntensity: 0.9,
                      clearcoat: 1,
                      transparent: true,
                      // transmission: .95,
                      opacity: .125,
                      reflectivity: 0.75,
                      ior: 0.9,
                      side: THREE.DoubleSide,
                    });
                    // 할당 시도
                    child.material = newMaterial;
                    child.castShadow = false;
                  }
                }
                // 유리병 뚜껑 (top.001)
                else if (child.name === 'top001') {
                  if (material instanceof THREE.MeshPhysicalMaterial) {
                      material.side = THREE.DoubleSide;
                  }
                }
                // 종이 재질 조정 (paper)
                else if (child.name === 'paper') {
                  if (material instanceof THREE.MeshStandardMaterial) {
                      material.color = new THREE.Color(0x17498B)
                      material.depthTest = true;
                      material.depthWrite = true;
                      material.roughness = 1;
                      material.side = THREE.DoubleSide;
                  }
                
                  // 그림자 설정
                  child.castShadow = true;
                }
                child.receiveShadow = true;
            }
          });
          return bottleGroup;
      };
      
      loader.load(
        '/models/bottle.glb', // public 폴더에 저장된 파일
        (gltf) => {
          // console.log('GLB loaded:', gltf);
          
          // 씬 전체를 가져옴
          const bottleGroup = setupMaterials(gltf.scene);
          
          // 애니메이션 믹서 생성
          const mixer = new THREE.AnimationMixer(bottleGroup);
          
          // 애니메이션 액션 찾기
          const openClip = gltf.animations.find(clip => clip.name === 'bottleOpenAction');
          const closeClip = gltf.animations.find(clip => clip.name === 'bottleCloseAction');
          
          if (!openClip || !closeClip) {
            reject(new Error('Required animations not found'));
            return;
          }
          
          // 애니메이션 액션 생성
          const openAction = mixer.clipAction(openClip);
          const closeAction = mixer.clipAction(closeClip);
          
          // 애니메이션 설정
          openAction.setLoop(THREE.LoopOnce, 1);
          openAction.clampWhenFinished = true;
          
          closeAction.setLoop(THREE.LoopOnce, 1);
          closeAction.clampWhenFinished = true;
          
          // 헬퍼 오브젝트 숨기기
          const forModifier = bottleGroup.getObjectByName('for_modifier');
          const pathObject = bottleGroup.getObjectByName('path');
          // console.log('hide object:', forModifier);
          // console.log('hide object:', pathObject);
          
          if (forModifier) forModifier.visible = false;
          if (pathObject) pathObject.visible = false;
          
          resolve({ bottleGroup, mixer, openAction, closeAction });
        },
        (progress) => {
          // console.log('Loading progress:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
          console.error('Error loading GLB:', error);
          reject(error);
        }
      );
    });
  }, []);

  const elementRef = useRef<HTMLDivElement|null>(null);
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const animationRef = useRef<number | null>(null);

  // GLB 관련 refs
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const openActionRef = useRef<THREE.AnimationAction | null>(null);
  const closeActionRef = useRef<THREE.AnimationAction | null>(null);
  const bottleGroupRef = useRef<THREE.Group | null>(null);

  // 애니메이션 상태
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const lastTimeRef = useRef<number>(0);

  const asidePaperRef = useRef<HTMLElement|null>(null);

  const animateBottleFloat = useCallback((time: number) => {
    if(bottleGroupRef.current){
      const speed = 1;
      bottleGroupRef.current.rotation.x = Math.sin(speed * time * 0.3) * 0.125 + Math.sin(speed * time * 0.5) * 0.0625;
      bottleGroupRef.current.rotation.z = -0.25 + Math.sin(speed * time * 0.25) * 0.0625 + Math.sin(speed * time * 0.4) * 0.03125;
      bottleGroupRef.current.position.y = Math.sin(speed * time * 0.8) * 0.25 + Math.sin(speed * time * 0.35) * 0.125;
    }
  }, [animationState]);

    // 열기 애니메이션
  const startOpenAnimation = useCallback(async () => {
    if (isAnimating || isOpen || !openActionRef.current || !closeActionRef.current) return;
    
    setIsAnimating(true);
    setAnimationState('opening');
    
    // 이전 애니메이션 중지
    closeActionRef.current.stop();
    
    // 열기 애니메이션 실행
    openActionRef.current.reset();
    openActionRef.current.play();
    
    // 애니메이션 완료 대기
    const duration = openActionRef.current.getClip().duration * 1000; // ms로 변환
    
    setTimeout(() => {
      gsap.to(asidePaperRef.current, {
        x: "0%",
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          setAnimationState('completed');
          setIsOpen(true);
          setIsAnimating(false);
          onContactDialogOpen?.();
        }
      });
    }, duration);
    
  }, [isAnimating, isOpen, onContactDialogOpen]);

  // 닫기 애니메이션
  const startCloseAnimation = useCallback(async () => {
    if (isAnimating) return;
    setIsAnimating(true);
    gsap.to(asidePaperRef.current, {
      x: "-200%",
      duration: 0.5,
      ease: "power2.in",
      onComplete: () => {
        if (!isOpen || !openActionRef.current || !closeActionRef.current) return;

        setAnimationState('closing'); // 역순 재생
        
        // 이전 애니메이션 중지
        openActionRef.current.stop();
        
        // 닫기 애니메이션 실행
        closeActionRef.current.reset();
        closeActionRef.current.play();
        
        // 애니메이션 완료 대기
        const duration = closeActionRef.current.getClip().duration * 1000;
        
        setTimeout(() => {
          setAnimationState('idle');
          setIsOpen(false);
          setIsAnimating(false);
          onContactDialogClose?.();
        }, duration);
      }
    });
    
  }, [isAnimating, isOpen, onContactDialogClose]);

  // 토글 클릭 핸들러
  const handleBottleClick = useCallback(() => {
    if (isAnimating) return;
    
    if (isOpen) {
      startCloseAnimation();
    } else {
      startOpenAnimation();
    }
  }, [isAnimating, isOpen, startOpenAnimation, startCloseAnimation]);

  // 애니메이션 루프
  const startAnimation = useCallback(() => {
    if (animationRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const animate = () => {
      const time = Date.now() * 0.001;
      const deltaTime = time - (lastTimeRef.current || time);
      lastTimeRef.current = time;

      if (mixerRef.current) {
        // GLB 애니메이션 업데이트
        mixerRef.current.update(deltaTime);
      }
      if (animationState === 'idle') {
        // 기본 떠다니는 애니메이션
        animateBottleFloat(time);
      } 

      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();
  }, [animateBottleFloat]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);
  
  // Three.js 초기화
  useEffect(() => {
    if (!elementRef.current) return;

    if(!sceneRef.current){
      // Scene 설정
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight * 0.20, 0.01, 2000);
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

      renderer.setSize(window.innerWidth * 0.20, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      elementRef.current.appendChild(renderer.domElement);

      // 조명 설정
      const ambientLight = new THREE.AmbientLight(0x17498B, 0.75);
      scene.add(ambientLight);
      const ambientLight1 = new THREE.AmbientLight(0xBAD8FF, 0.25);
      scene.add(ambientLight1);

      const directionalLight = new THREE.DirectionalLight(0x17498B, 0.8);
      directionalLight.position.set(5, 5, 5);
      scene.add(directionalLight);
      const directionalLight2 = new THREE.DirectionalLight(0x17498B, 1.0);
      directionalLight2.position.set(4, -5, 4);
      scene.add(directionalLight2);

      // 카메라 위치
      camera.position.set(10, 0, 0);
      camera.lookAt(0, 0, 0);

      // refs 저장
      sceneRef.current = scene;
      rendererRef.current = renderer;
      cameraRef.current = camera;
    }

    // 리사이즈 핸들링
    const handleResize = () => {
      const container = elementRef.current;
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        if(cameraRef.current) {
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
        }
        if(rendererRef.current){
          rendererRef.current.setSize(width, height);
        }
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopAnimation();
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (elementRef.current && rendererRef.current!.domElement) {
        elementRef.current.removeChild(rendererRef.current!.domElement);
      }

      if (asidePaperRef.current) {
        gsap.killTweensOf(asidePaperRef.current);
      }

      {
        // Three.js 리소스 정리
        rendererRef.current!.dispose();

        // refs 초기화
        sceneRef.current = null;
        rendererRef.current = null;
        cameraRef.current = null;
        bottleGroupRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if(rendererRef.current){
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, isDesktop ? 2 : 1));
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!sceneRef.current || !rendererRef.current || !backgroundGradient) return;

    const envMap = createGradientEnvironmentMap(rendererRef.current, backgroundGradient);
    
    // 씬 전체에 환경맵 적용
    sceneRef.current.environment = envMap;
    
    // 기존 병 모델이 있다면 업데이트
    if (bottleGroupRef.current) {
      bottleGroupRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshPhysicalMaterial) {
          child.material.envMap = envMap;
          child.material.needsUpdate = true;
        }
      });
    }

    return () => {
      envMap.dispose();
    };
  }, [backgroundGradient]);

  useEffect(() => {
    if (!sceneRef.current) return;

    const initializeBottle = async () => {
      try {
        // 기존 모델이 있다면 제거
        if (bottleGroupRef.current) {
          sceneRef.current!.remove(bottleGroupRef.current!)
          bottleGroupRef.current = null;
        }
        
        const { bottleGroup, mixer, openAction, closeAction } = await createBottleFromGLB();
        
        // 크기 및 위치 조정
        bottleGroup.scale.set(0.5, 0.5, 0.5);
        bottleGroup.position.set(0, 0, 0);
        
        // refs에 저장
        bottleGroupRef.current = bottleGroup;
        mixerRef.current = mixer;
        openActionRef.current = openAction;
        closeActionRef.current = closeAction;
        
        if(sceneRef.current) {
          // 씬에 추가
          sceneRef.current.add(bottleGroupRef.current!);
        }
        
        // console.log('Bottle initialized successfully');
      } catch (error) {
        console.error('Failed to initialize bottle:', error);
      }
    };

    initializeBottle();
    startAnimation()
    // console.log("startFloatingBottle")
  }, [createBottleFromGLB])

    // 탭이 비활성화되었을 때만 정지
  useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden) {
            stopAnimation();
        } else {
            startAnimation();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return (
    <div className="relative w-full h-full pointer-events-none">
      <aside ref={asidePaperRef} className="absolute pointer-events-auto z-60 right-0 top-0 w-full h-full flex items-center justify-center backdrop-blur-md" style={{
        cursor:"default",
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        transform:"translateX(-200%)", willChange:"transform"
      }} onClick={() => {
        if (isAnimating) return;
        
        if (isOpen) {
          startCloseAnimation();
        }
      }}>
        <div className='pointer-events-auto' style={{
          padding: '2rem',
          backgroundImage: `url(${texturePaper})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat"
        }} onClick={(e) => {
          e.stopPropagation()
        }}>
          <div className='about-projects grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-4'>
            {contactList.current.map((link, index) => {
              return <a
                key={index}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="pointer-events-auto project-card group relative"
                title={link.title}
              >
                {link.type}
              </a>
            })}
          </div>
        </div>
      </aside>

      {/* Three.js 캔버스 */}
      <div 
        ref={elementRef} 
        className="w-1/5 h-full pointer-events-none"
        style={{isolation:"isolate"}}
      />

      <div className="absolute left-0 top-0 w-1/5 h-full flex items-center justify-center z-80">
        {/* 클릭 가능한 영역 */}
        <div className="pointer-events-auto cursor-pointer w-[80px] h-[200px] mb-[120px]"
        onClick={handleBottleClick}
        title={isOpen ? "닫기" : "메시지 병 열기"}>
        </div>
      </div>
    </div>
  );
};

export default FloatingBottle;