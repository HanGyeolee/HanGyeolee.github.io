import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as THREE from 'three';
import useDeviceDetection from '../util/MobileHook.ts';

interface FloatingBottleProps {
  onContactDialogOpen?: () => void;
  onContactDialogClose?: () => void;
}

type AnimationState = 'idle' | 'opening' | 'paperOut' | 'paperExpand' | 'completed';

/**
 * 1. 스크롤 애니메이팅을 통해서 section 이동할 때마다, 메시지 병이 해류에 휩쓸려서 한 바퀴 빙글 돌게 할 거야.
 * 2. 메시지 병을 클릭하면 뚜껑이 '뽕' 열리면서 안에 있는 돌돌 말린 종이가 튀어 나와.
 * 3. 돌돌말린 종이가 펼쳐지면서 dialog 처럼 전체화면을 덮어. 여기서 fixed 로 설정하면 될 것 같아.
 * @param param0 
 * @returns 
 */
const FloatingBottle: React.FC<FloatingBottleProps> = ({ 
  onContactDialogOpen, 
  onContactDialogClose 
}) => {
  const { isDesktop } = useDeviceDetection();

  const elementRef = useRef<HTMLDivElement|null>(null);
  // Three.js refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const animationRef = useRef<number | null>(null);

  // 3D 오브젝트 refs
  const bottleGroupRef = useRef<THREE.Group | null>(null);
  const bottleRef = useRef<THREE.Mesh | null>(null);
  const corkRef = useRef<THREE.Mesh | null>(null);
  const paperRef = useRef<THREE.Mesh | null>(null);
  const stringRef = useRef<THREE.Mesh | null>(null);

  // 애니메이션 상태
  const [animationState, setAnimationState] = useState<AnimationState>('idle');
  const [animationProgress, setAnimationProgress] = useState<number>(0);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // 3D Geometry 생성 함수들 (추후 구현)
  const createBottleGeometry = useCallback((segments: number, heightSegments: number): THREE.BufferGeometry => {
    // TODO: 병 geometry 구현
    console.log('Creating bottle geometry with segments:', segments, heightSegments);
    return new THREE.CylinderGeometry(1, 1, 3, segments, heightSegments);
  }, []);

  const createCorkGeometry = useCallback((segments: number): THREE.BufferGeometry => {
    // TODO: 코르크 마개 geometry 구현
    console.log('Creating cork geometry with segments:', segments);
    return new THREE.CylinderGeometry(0.5, 0.5, 0.3, segments);
  }, []);

  const createPaperGeometry = useCallback((widthSegments: number, heightSegments: number): THREE.BufferGeometry => {
    // TODO: 종이 geometry 구현 (morphing 대응)
    console.log('Creating paper geometry with segments:', widthSegments, heightSegments);
    return new THREE.PlaneGeometry(2, 3, widthSegments, heightSegments);
  }, []);

  const createStringGeometry = useCallback((segments: number): THREE.BufferGeometry => {
    // TODO: 종이 끈 geometry 구현
    console.log('Creating string geometry with segments:', segments);
    return new THREE.CylinderGeometry(0.02, 0.02, 2, segments);
  }, []);

  // 재질 생성 함수들 (추후 구현)
  const createBottleMaterial = useCallback((): THREE.Material => {
    // TODO: 병 재질 구현 (유리 효과)
    return new THREE.MeshPhongMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.7
    });
  }, []);

  const createCorkMaterial = useCallback((): THREE.Material => {
    // TODO: 코르크 재질 구현
    return new THREE.MeshLambertMaterial({
      color: 0x8B4513
    });
  }, []);

  const createPaperMaterial = useCallback((): THREE.Material => {
    // TODO: 종이 재질 구현
    return new THREE.MeshLambertMaterial({
      color: 0xFFF8DC,
      side: THREE.DoubleSide
    });
  }, []);

  const createStringMaterial = useCallback((): THREE.Material => {
    // TODO: 끈 재질 구현
    return new THREE.MeshLambertMaterial({
      color: 0x654321
    });
  }, []);

  // 애니메이션 함수들 (추후 구현)
  const animateBottleFloat = useCallback((time: number) => {
    if(bottleGroupRef.current){
        // TODO: 병 떠다니는 애니메이션 구현
        if (animationState === 'idle') {
            bottleGroupRef.current.rotation.x = Math.sin(time * 0.25) * 0.25 + Math.sin(time * 0.4) * 0.125;
            bottleGroupRef.current.rotation.z = Math.sin(time * 0.3) * 0.25 + Math.sin(time * 0.5) * 0.125;
            bottleGroupRef.current.position.y = Math.sin(time * 0.8) * 0.5 + Math.sin(time * 0.35) * 0.25;
        }
    }
  }, [animationState]);

  const animateCorkOpening = useCallback((progress: number) => {
    // TODO: 코르크 마개 열림 애니메이션 구현
    if (corkRef.current) {
      const easeOut = 1 - Math.pow(1 - progress, 3);
      corkRef.current.position.y = easeOut * 2;
      corkRef.current.rotation.z = easeOut * Math.PI * 0.5;
    }
  }, []);

  const animatePaperEmerge = useCallback((progress: number) => {
    // TODO: 종이 튀어나오기 애니메이션 구현
    if (paperRef.current) {
      const easeOut = 1 - Math.pow(1 - progress, 2);
      paperRef.current.position.y = easeOut * 1.5;
      paperRef.current.visible = true;
    }
  }, []);

  const animatePaperMorphing = useCallback((progress: number) => {
    // TODO: 종이 morphing 애니메이션 구현 (원통 → 평면)
    if (paperRef.current) {
      const geometry = paperRef.current.geometry as THREE.BufferGeometry;
      // morphing 로직 구현 예정
      const scale = 1 + progress * 9;
      paperRef.current.scale.set(scale, scale, 1);
    }
  }, []);

  const animateString = useCallback((progress: number) => {
    // TODO: 끈 애니메이션 구현
    if (stringRef.current) {
      stringRef.current.visible = progress < 0.8; // 종이가 펼쳐지면서 끈 사라짐
    }
  }, []);

  // 열기 애니메이션 시퀀스
  const startOpenAnimation = useCallback(async () => {
    if (isAnimating || isOpen) return;
    
    setIsAnimating(true);
    
    // Phase 1: Cork Opening
    setAnimationState('opening');
    for (let i = 0; i <= 100; i++) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animateCorkOpening(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Phase 2: Paper Emerge
    setAnimationState('paperOut');
    for (let i = 0; i <= 100; i++) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animatePaperEmerge(progress);
      await new Promise(resolve => setTimeout(resolve, 8));
    }
    
    // Phase 3: Paper Morphing
    setAnimationState('paperExpand');
    for (let i = 0; i <= 100; i++) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animatePaperMorphing(progress);
      animateString(progress);
      await new Promise(resolve => setTimeout(resolve, 12));
    }
    
    setAnimationState('completed');
    setIsOpen(true);
    setIsAnimating(false);
    onContactDialogOpen?.();
  }, [isAnimating, isOpen, animateCorkOpening, animatePaperEmerge, animatePaperMorphing, animateString, onContactDialogOpen]);

  // 닫기 애니메이션 시퀀스
  const startCloseAnimation = useCallback(async () => {
    if (isAnimating || !isOpen) return;
    
    setIsAnimating(true);
    
    // Phase 1: Paper Collapse (completed -> paperExpand)
    setAnimationState('paperExpand');
    for (let i = 100; i >= 0; i--) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animatePaperMorphing(progress);
      animateString(progress);
      await new Promise(resolve => setTimeout(resolve, 12));
    }
    
    // Phase 2: Paper Hide (paperExpand -> paperOut)
    setAnimationState('paperOut');
    for (let i = 100; i >= 0; i--) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animatePaperEmerge(progress);
      await new Promise(resolve => setTimeout(resolve, 8));
    }
    
    // Phase 3: Cork Closing (paperOut -> opening)
    setAnimationState('opening');
    for (let i = 100; i >= 0; i--) {
      const progress = i / 100;
      setAnimationProgress(progress);
      animateCorkOpening(progress);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    setAnimationState('idle');
    setIsOpen(false);
    setIsAnimating(false);
    onContactDialogClose?.();
  }, [isAnimating, isOpen, animateCorkOpening, animatePaperEmerge, animatePaperMorphing, animateString, onContactDialogClose]);

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
      
      // 기본 떠다니는 애니메이션
      animateBottleFloat(time);

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

    // Scene 설정
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight * 0.25, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth * 0.25, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isDesktop ? 2 : 1));
    elementRef.current.appendChild(renderer.domElement);

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // 디바이스별 세그먼트 수 결정
    const segments = isDesktop ? 64 : 32;
    const heightSegments = isDesktop ? 128 : 64;
    const paperSegments = isDesktop ? 128 : 64;

    // 3D 오브젝트 생성
    const bottleGroup = new THREE.Group();

    // 병 생성
    const bottleGeometry = createBottleGeometry(segments, heightSegments);
    const bottleMaterial = createBottleMaterial();
    const bottle = new THREE.Mesh(bottleGeometry, bottleMaterial);
    bottleGroup.add(bottle);

    // 코르크 마개 생성
    const corkGeometry = createCorkGeometry(segments);
    const corkMaterial = createCorkMaterial();
    const cork = new THREE.Mesh(corkGeometry, corkMaterial);
    cork.position.y = 1.65;
    bottleGroup.add(cork);

    // 종이 생성
    const paperGeometry = createPaperGeometry(paperSegments, paperSegments);
    const paperMaterial = createPaperMaterial();
    const paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.position.y = 1;
    bottleGroup.add(paper);

    // 끈 생성
    const stringGeometry = createStringGeometry(segments);
    const stringMaterial = createStringMaterial();
    const string = new THREE.Mesh(stringGeometry, stringMaterial);
    string.position.y = 0.5;
    bottleGroup.add(string);

    scene.add(bottleGroup);

    // 카메라 위치
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    {
        // refs 저장
        sceneRef.current = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;
        bottleGroupRef.current = bottleGroup;
        bottleRef.current = bottle;
        corkRef.current = cork;
        paperRef.current = paper;
        stringRef.current = string;
    }

    // 리사이즈 핸들링
    const handleResize = () => {
      const container = elementRef.current;
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    startAnimation()
                console.log("startFloatingBottle")
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      stopAnimation();
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (elementRef.current && renderer.domElement) {
        elementRef.current.removeChild(renderer.domElement);
      }

      {
        // Three.js 리소스 정리
        bottleGeometry.dispose();
        corkGeometry.dispose();
        paperGeometry.dispose();
        stringGeometry.dispose();
        (bottleMaterial as THREE.Material).dispose();
        (corkMaterial as THREE.Material).dispose();
        (paperMaterial as THREE.Material).dispose();
        (stringMaterial as THREE.Material).dispose();
        renderer.dispose();

        // refs 초기화
        sceneRef.current = null;
        rendererRef.current = null;
        cameraRef.current = null;
        bottleGroupRef.current = null;
        bottleRef.current = null;
        corkRef.current = null;
        paperRef.current = null;
        stringRef.current = null;
      }
    };
  }, [isDesktop, createBottleGeometry, createCorkGeometry, createPaperGeometry, createStringGeometry, 
      createBottleMaterial, createCorkMaterial, createPaperMaterial, createStringMaterial]);

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
      {/* Three.js 캔버스 */}
      <div 
        ref={elementRef} 
        className="w-1/4 h-full pointer-events-none"
      />
      <div className="absolute left-0 top-0 w-1/4 h-full flex items-center justify-center">
        {/* 클릭 가능한 영역 */}
        <div className="pointer-events-auto cursor-pointer w-[80px] h-[120px]"
        onClick={handleBottleClick}
        title={isOpen ? "닫기" : "메시지 병 열기"}>
        </div>
      </div>
      
      {/* 상태 표시 (개발용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="pointer-events-none absolute top-2 left-2 text-xs text-white bg-black/50 px-2 py-1 rounded">
          State: {animationState} Progress: {Math.round(animationProgress * 100)}% Open: {isOpen}
        </div>
      )}
    </div>
  );
};

export default FloatingBottle;