import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { useInViewport } from '../ui/ScrollIndicator.tsx';
import useDeviceDetection from '../util/MobileHook.ts';

const Underwater = ({ children }) => {
  const { isDesktop } = useDeviceDetection();

  const sceneRef:React.MutableRefObject<THREE.Scene|null> = useRef<THREE.Scene>(null);
  const rendererRef:React.MutableRefObject<THREE.WebGLRenderer|null> = useRef<THREE.WebGLRenderer>(null);
  const cameraRef:React.MutableRefObject<THREE.Camera|null> = useRef<THREE.Camera>(null);
  const surfaceMaterialRef:React.MutableRefObject<THREE.ShaderMaterial|null> = useRef<THREE.ShaderMaterial>(null);
  const animationRef:React.MutableRefObject<number|null> = useRef<number>(null);
  const { elementRef, isInViewport, isObserved } = useInViewport({
    threshold: 0.0625,
    rootMargin: '100px'
  });

  const waveVertexShader = `
    uniform float time;
    uniform float density;
    uniform float waveSteep;
    uniform float waveStrength;
    varying float vZ;
    varying float vY;
    varying vec3 vWorldPosition;

    // 2D Noise 함수 - 패턴 깨뜨리기용
    float noise(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    // Smoothed noise
    float smoothNoise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      
      float a = noise(i);
      float b = noise(i + vec2(1.0, 0.0));
      float c = noise(i + vec2(0.0, 1.0));
      float d = noise(i + vec2(1.0, 1.0));
      
      vec2 u = f * f * (3.0 - 2.0 * f);
      
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }
    
    // Fractal noise (multiple octaves)
    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      
      for (int i = 0; i < 2; i++) {
        value += amplitude * smoothNoise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }
    
    // Gerstner Wave 함수 - 더 현실적인 바다 물결
    vec3 gerstnerWave(vec2 direction, float amplitude, float frequency, float speed, vec2 position, float time) {
      // 위치 기반 variation 추가
      float noiseScale = 0.125;
      float phaseOffset  = fbm(position * noiseScale) * 6.283184;
      float freqVariation = 1.0 + fbm(position * noiseScale * 0.8) * 0.2; // ±20% variation
      float amplitudeVariation = 1.0 + fbm(position * noiseScale * 1.5) * 0.3; // ±30% variation

      float phase = frequency * freqVariation * density * dot(direction, position) + speed * time + phaseOffset;
      amplitude *= amplitudeVariation;
      
      vec3 wave;
      wave.x = waveSteep * amplitude * direction.x * cos(phase);
      wave.y = waveSteep * amplitude * direction.y * cos(phase);
      wave.z = waveStrength * amplitude * sin(phase);
      
      return wave;
    }
    
    void main() {
      vec3 pos = position;
      vec2 worldPos = pos.xy;
      
      // 거리 기반 LOD (Level of Detail) - 멀리 있을수록 적은 계산
      float distanceFromCamera = length(worldPos) / 512.0;
      float lodFactor = clamp(1.0 - distanceFromCamera, 0.01, 1.0);
      
      // 여러 Gerstner 파도를 조합하여 자연스러운 바다 생성
      vec3 wave = vec3(0.0);
      
      // 큰 파도들
      wave += gerstnerWave(normalize(vec2(1.0, 0.3)), 0.4, 0.04, 1.2, worldPos, time);
      wave += gerstnerWave(normalize(vec2(-0.7, -1.0)), 0.3, 0.05, 0.9, worldPos, time);
      wave += gerstnerWave(normalize(vec2(-0.5, 0.8)), 0.2, 0.06, 1.5, worldPos, time);
      wave += gerstnerWave(normalize(vec2(0.8, -0.1)), 0.5, 0.04, 1.1, worldPos, time);
      
      // LOD 기반 추가 파도들 (가까이 있을 때만)
      if (lodFactor > 0.625) {
        // 중간 파도들
        wave += gerstnerWave(normalize(vec2(0.7, -0.125)), 0.15, 0.1, 2.0, worldPos, time);
        wave += gerstnerWave(normalize(vec2(-0.8, 0.25)), 0.125, 0.12, 1.8, worldPos, time);
        
        if (lodFactor > 0.75) {
          // 작은 잔물결들
          wave += gerstnerWave(normalize(vec2(0.9, 0.4)), 0.075, 0.4, 3.0, worldPos, time);
          wave += gerstnerWave(normalize(vec2(-0.2, 0.7)), 0.06, 0.48, 2.5, worldPos, time);
          wave += gerstnerWave(normalize(vec2(0.4, -0.6)), 0.05, 0.6, 4.0, worldPos, time);

          // 추가 고밀도 잔물결들
          wave += gerstnerWave(normalize(vec2(0.6, 0.8)), 0.04, 0.8, 5.0, worldPos, time);
          wave += gerstnerWave(normalize(vec2(-0.7, 0.3)), 0.03, 1.0, 4.5, worldPos, time);
          wave += gerstnerWave(normalize(vec2(0.1, -0.9)), 0.025, 1.2, 5.5, worldPos, time);
        }
      }

      // 추가 noise 기반 디테일
      float noiseDetail = fbm(worldPos * 0.1 + time * 0.1) * 0.02;
      wave.z += noiseDetail;

      // 위치에 파도 효과 적용
      pos += wave * lodFactor;
      
      vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
      vWorldPosition = worldPosition.xyz;
      vZ = distance(worldPosition.z, cameraPosition.z);
      vY = distance(worldPosition.y, cameraPosition.y);
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `
  const distanceFragmentShader = `
    uniform float whiteDistance;
    uniform float maxWhite;
    uniform float fadeDistance;
    uniform float maxFade;
    uniform float baseOpacity;
    uniform vec3 surfaceColor;
    
    varying float vZ;
    varying float vY;
    varying vec3 vWorldPosition;
    
    void main() {
      // 거리에 따른 opacity 계산
      float opacity = baseOpacity;
      vec3 color = surfaceColor;
      
      if (vZ > fadeDistance) {
        float fadeRatio = (vZ - fadeDistance) / (maxFade - fadeDistance);
        fadeRatio = clamp(fadeRatio, 0.0, 1.0);
        opacity = baseOpacity * (1.0 - fadeRatio);
      }
    
      // 파도 높이에 따른 거품 효과 (Y 좌표 기준)
      float waveHeight = vWorldPosition.y - 16.0; // 기본 수면 높이에서의 상대적 높이
      if (waveHeight > whiteDistance) { // 파도가 whiteDistance 이상 높을 때 거품 시작
        float foamRatio = clamp((waveHeight - whiteDistance) / maxWhite, 0.0, 1.0); // whiteDistance~maxWhite 범위에서 0~1로 매핑
        color = mix(surfaceColor, vec3(1.0, 1.0, 1.0), foamRatio); // 파란색에서 흰색으로
      }
      
      gl_FragColor = vec4(color, opacity);
    }
  `

  // 2. 애니메이션 제어 함수들 추가
  const startAnimation = useCallback(() => {
    if (animationRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    
    const animate = () => {
      const time = (Date.now() * 0.0005) % 86400;
      if (surfaceMaterialRef.current) {
        surfaceMaterialRef.current.uniforms.time.value = time;
      }
      
      rendererRef.current!.render(sceneRef.current!, cameraRef.current!);
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!elementRef.current) return;

    // Scene 설정
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    elementRef.current.appendChild(renderer.domElement);
    
    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera; // ref 저장 추가

    var segments:number;
    if(isDesktop) {
      segments = 1024
    } else {
      segments = 256
    }
    // 수면 (상단)
    const surfaceGeometry = new THREE.PlaneGeometry(512, 512, segments, segments);
    const surfaceMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        density:      { value: 8.0 }, // 물결 밀도 3.0
        waveSteep:    { value: 1.625 }, // 물결 첨도 1.5
        waveStrength: { value: 0.625 }, // 물결 강도 1.0
        whiteDistance:{ value: 0.1875 }, // 흰색 시작 상대 거리
        maxWhite:     { value: 5.0 }, // 완전히 흰색이 되는 거리
        fadeDistance: { value: 8.0 }, // 페이드 시작 절대 거리
        maxFade:      { value: 128.0 },// 완전히 투명해지는 거리
        baseOpacity:  { value: 0.875 },    // 기본 투명도
        surfaceColor: { value: new THREE.Color(0x09aafb) } 
      },
      vertexShader: waveVertexShader,
      fragmentShader: distanceFragmentShader,
      transparent: true,
      side: THREE.DoubleSide
    });
    surfaceMaterialRef.current = surfaceMaterial;
    
    const surface0 = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
    surface0.rotation.x = -Math.PI / 2;
    surface0.position.y = 16;
    surface0.position.z = -128;
    scene.add(surface0);

    // 카메라 위치
    camera.position.set(0, -8, 0);
    camera.lookAt(0, -8, 0);

    // 리사이즈 핸들링
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      stopAnimation(); // 애니메이션 정리
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (elementRef.current && renderer.domElement) {
        elementRef.current.removeChild(renderer.domElement);
      }
      // Three.js 리소스 정리
      surfaceGeometry.dispose();
      surfaceMaterial.dispose();
      renderer.dispose();
      
      // ref 초기화
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
      surfaceMaterialRef.current = null;
    };
  }, []);

  // 3. 뷰포트 상태에 따른 애니메이션 제어 useEffect 추가
  useEffect(() => {
    if (!isObserved) return; // 아직 한 번도 관찰되지 않았으면 return
    
    if (isInViewport) {
      startAnimation();
    } else {
      stopAnimation();
    }
    
    return () => {
      stopAnimation();
    };
  }, [isInViewport, isObserved, startAnimation, stopAnimation]);

  return (
    <div className="absolute inset-0 w-full">
      {/* Three.js 3D 효과 */}
      <div 
        ref={elementRef} 
        className="absolute top-[-2px] right-0 bottom-0 left-0"
      />
      
      {/* 콘텐츠 오버레이 */}
      <div className="flex flex-col items-center justify-center relative z-20 w-full h-full overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Underwater;