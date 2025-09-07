import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Physics } from './Physics.tsx';
import { ObjectData, SagA, defaultObjects } from './BlackHoleStructs.tsx';
import { createGeodesicMaterial } from './GeodesicShader.tsx';

/**
 * 카메라 클래스 - 블랙홀 중심 궤도 카메라
 */
class OrbitCamera {
  /** 카메라가 바라보는 목표점 (항상 블랙홀 중심) */
  public target: THREE.Vector3 = new THREE.Vector3(0.0, 0.0, 0.0);
  
  /** 블랙홀로부터의 거리 (m) */
  public radius: number = 6.34194e10;
  
  /** 최소/최대 거리 제한 (m) */
  public minRadius: number = 1e10;
  public maxRadius: number = 1e12;
  
  /** 구면 좌표 (radians) */
  public azimuth: number = 0.0;
  public elevation: number = Physics.M_PI / 2.0;
  
  /** 제어 속도 */
  public orbitSpeed: number = 0.01;
  public zoomSpeed: number = 25e9;
  
  /** 상태 */
  public dragging: boolean = false;
  public moving: boolean = false;
  public lastX: number = 0.0;
  public lastY: number = 0.0;

  /**
   * 구면 좌표계로 카메라 위치 계산
   */
  position(): THREE.Vector3 {
    const clampedElevation = Math.max(0.01, Math.min(this.elevation, Physics.M_PI - 0.01));
    
    return new THREE.Vector3(
      this.radius * Math.sin(clampedElevation) * Math.cos(this.azimuth),
      this.radius * Math.cos(clampedElevation),
      this.radius * Math.sin(clampedElevation) * Math.sin(this.azimuth)
    );
  }

  /**
   * 카메라 상태 업데이트
   */
  update(): void {
    this.target.set(0.0, 0.0, 0.0);
    this.moving = this.dragging;
  }

  /**
   * 마우스 움직임 처리
   */
  processMouseMove(x:number, y:number) {
    const dx = x - this.lastX;
    const dy = y - this.lastY;

    if(this.dragging){
      this.azimuth += dx * this.orbitSpeed;
      this.elevation -= dy * this.orbitSpeed;
      this.elevation = Math.max(0.01, Math.min(this.elevation, Physics.M_PI - 0.01));
    }

    this.lastX = x;
    this.lastY = y;
    this.update();
  }

  /**
   * 마우스 버튼 처리
   */
  processMouseButton(button: number, action: 'press' | 'release'): void {
    if (button === 0) { // 왼쪽 마우스 버튼
      if (action === 'press') {
        this.dragging = true;
      } else if (action === 'release') {
        this.dragging = false;
      }
    }
  }

  /**
   * 스크롤 처리 (줌)
   */
  processScroll(deltaY: number): void {
    this.radius += deltaY * this.zoomSpeed * 0.001;
    this.radius = Math.max(this.minRadius, Math.min(this.radius, this.maxRadius));
    this.update();
  }
}

/**
 * 블랙홀 엔진 설정
 */
interface BlackHoleEngineConfig {
  width?: number;
  height?: number;
  computeWidth?: number;
  computeHeight?: number;
  maxSteps?: number;
  gravityEnabled?: boolean;
  objects?:ObjectData[];
}


/**
 * 블랙홀 시뮬레이션 엔진 컴포넌트
 */
const BlackHoleEngine: React.FC<BlackHoleEngineConfig> = ({
  width = 800,
  height = 600,
  computeWidth = 200,
  computeHeight = 150,
  maxSteps = 30000,
  gravityEnabled = false,
  objects = defaultObjects,
}) => {
  // React refs
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitCameraRef = useRef<OrbitCamera>(new OrbitCamera());
  const animationIdRef = useRef<number | null>(null);

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [gravityState, setGravityState] = useState(gravityEnabled);

  // Refs for rendering objects
  const gridRef = useRef<THREE.LineSegments | null>(null);
  const rayTracingQuadRef = useRef<THREE.Mesh | null>(null);
  const objectsRef = useRef<ObjectData[]>([...objects]);

  /**
   * 시공간 격자 생성 함수
   * 블랙홀의 중력장에 의해 휘어진 격자를 생성합니다.
   */
  const generateGrid = useCallback((objects: ObjectData[]): THREE.BufferGeometry => {
    const gridSize = 29;
    const spacing = 1e10; // 격자 간격
    
    const vertices: number[] = [];
    const indices: number[] = [];

    // 격자 정점 생성
    for (let z = 0; z <= gridSize; z++) {
      for (let x = 0; x <= gridSize; x++) {
        const worldX = (x - gridSize / 2) * spacing;
        const worldZ = (z - gridSize / 2) * spacing;
        
        let y = 0.0;

        // 슈바르츠실트 기하학을 이용한 격자 왜곡
        objects.forEach(obj => {
          const objPos = new THREE.Vector3(obj.posRadius.x, obj.posRadius.y, obj.posRadius.z);
          const mass = obj.mass;
          
          // 슈바르츠실트 반지름 계산
          const r_s = 2.0 * Physics.G * mass / Physics.c_2;
          const dx = worldX - objPos.x;
          const dz = worldZ - objPos.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // 사건의 지평선 밖에서만 계산
          if (dist > r_s) {
            const deltaY = 2.0 * Math.sqrt(r_s * (dist - r_s));
            y += deltaY - 3e10;
          } else {
            // 사건의 지평선 내부는 깊은 함정으로 표현
            y += -2.0 * Math.sqrt(r_s * (r_s)) - 3e10;
          }
        });

        vertices.push(worldX, y, worldZ);
      }
    }

    // 격자 인덱스 생성 (선분용)
    for (let z = 0; z < gridSize; z++) {
      for (let x = 0; x < gridSize; x++) {
        const i = z * (gridSize + 1) + x;
        
        // 수평선
        indices.push(i, i + 1);
        
        // 수직선
        indices.push(i, i + gridSize + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);

    return geometry;
  }, []);

  /**
   * 레이 트레이싱용 풀스크린 쿼드 생성
   */
  const createRayTracingQuad = useCallback((): THREE.Mesh => {
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = createGeodesicMaterial(SagA);
    
    // 해상도 업데이트
    material.uniforms.uResolution.value.set(computeWidth, computeHeight);
    material.uniforms.uAspect.value = computeWidth / computeHeight;
    material.uniforms.uSteps.value = maxSteps;

    return new THREE.Mesh(geometry, material);
  }, [computeWidth, computeHeight, maxSteps]);

  /**
   * Three.js 초기화
   */
  const initializeThreeJS = useCallback(() => {
    if (!mountRef.current) return;

    // 렌더러 생성
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(computeWidth, computeHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.autoClear = false;
    
    // WebGL2 컨텍스트 확인
    const gl = renderer.getContext();
    if (!(gl instanceof WebGL2RenderingContext)) {
      console.warn('WebGL2 not supported, falling back to basic rendering');
    }

    // 씬 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // 카메라 생성
    const camera = new THREE.PerspectiveCamera(60, computeWidth / computeHeight, 1e3, 1e14);

    // DOM에 추가
    mountRef.current.appendChild(renderer.domElement);

    // Refs 저장
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    setIsInitialized(true);
  }, [computeWidth, computeHeight]);

  /**
   * 렌더링 오브젝트들 생성
   */
  const createRenderObjects = useCallback(() => {
    if (!sceneRef.current || !cameraRef.current) return;

    const scene = sceneRef.current;

    // 시공간 격자 생성
    const gridGeometry = generateGrid(objectsRef.current);
    const gridMaterial = new THREE.LineBasicMaterial({ 
      color: 0x333333, 
      transparent: true, 
      opacity: 0.6 
    });
    const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
    scene.add(grid);
    gridRef.current = grid;

    // 레이 트레이싱 쿼드 생성
    const rayTracingQuad = createRayTracingQuad();
    
    scene.add(rayTracingQuad);
    rayTracingQuadRef.current = rayTracingQuad;

    // 천체 객체들 시각화 (참조용)
    objectsRef.current.forEach(obj => {
      if (obj.posRadius.w > 0) {
        const geometry = new THREE.SphereGeometry(obj.posRadius.w / 1e10, 16, 16);
        const material = new THREE.MeshBasicMaterial({ 
          color: new THREE.Color(obj.color.x, obj.color.y, obj.color.z),
          transparent: true,
          opacity: obj.color.w,
          wireframe: true,
        });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(
          obj.posRadius.x / 1e10,
          obj.posRadius.y / 1e10,
          obj.posRadius.z / 1e10
        );
        scene.add(sphere);
      }
    });

  }, [generateGrid, createRayTracingQuad]);

  /**
   * 중력 시뮬레이션 업데이트
   */
  const updateGravitySimulation = useCallback((deltaTime: number) => {
    if (!gravityState) return;

    // N-body 중력 계산
    objectsRef.current.forEach((obj1, i) => {
      objectsRef.current.forEach((obj2, j) => {
        if (i === j) return;
        
        const dx  = obj2.posRadius.x - obj1.posRadius.x;
        const dy = obj2.posRadius.y - obj1.posRadius.y;
        const dz = obj2.posRadius.z - obj1.posRadius.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance > 0) {
          const direction = new THREE.Vector3(
            dx / distance, dy / distance, dz / distance
          );
          
          // 중력 가속도: F = GMm/r² -> a = GM/r²
          const acceleration = (Physics.G * obj1.mass * obj2.mass) / (distance * distance);
          const forceDir = direction.multiplyScalar(acceleration * deltaTime);
          
          // 속도 업데이트
          obj1.velocity.add(forceDir);
          
          // 위치 업데이트
          const deltaPos = obj1.velocity.clone().multiplyScalar(deltaTime);
          obj1.posRadius.x += deltaPos.x;
          obj1.posRadius.y += deltaPos.y;
          obj1.posRadius.z += deltaPos.z;
        }
      });
    });

    // 격자 재생성 (중력 변화 반영)
    if (gridRef.current && sceneRef.current) {
      sceneRef.current.remove(gridRef.current);
      const newGridGeometry = generateGrid(objectsRef.current);
      const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x333333, 
        transparent: true, 
        opacity: 0.6 
      });
      gridRef.current = new THREE.LineSegments(newGridGeometry, gridMaterial);
      sceneRef.current.add(gridRef.current);
    }
  }, [gravityState, generateGrid]);

  /**
   * 렌더링 루프
   */
  const animate = useCallback((timestamp: number) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;

    const deltaTime = 0.016; // 대략 60fps

    // 궤도 카메라 업데이트
    const orbitCamera = orbitCameraRef.current;
    orbitCamera.update();
    
    const cameraPos = orbitCamera.position();
    cameraRef.current.position.copy(cameraPos);
    cameraRef.current.lookAt(orbitCamera.target);

    // 중력 시뮬레이션 업데이트
    updateGravitySimulation(deltaTime);

    // 레이 트레이싱 쉐이더 유니폼 업데이트
    if (rayTracingQuadRef.current) {
      const material = rayTracingQuadRef.current.material as THREE.ShaderMaterial;
      // 시간 업데이트
      material.uniforms.uTime.value = timestamp * 0.001;
      // 카메라 정보 업데이트
      material.uniforms.uCamPos.value.copy(cameraPos);
      
      const cameraDir = orbitCamera.target.clone().sub(cameraPos).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(cameraDir, up).normalize();
      const correctedUp = new THREE.Vector3().crossVectors(right, cameraDir);
      
      material.uniforms.uCamForward.value.copy(cameraDir);
      material.uniforms.uCamRight.value.copy(right);
      material.uniforms.uCamUp.value.copy(correctedUp);
      material.uniforms.uMoving.value = orbitCamera.moving;
          
      // 객체 정보 업데이트
      const count = Math.min(objectsRef.current.length, 16);
      material.uniforms.uNumObjects.value = count;
      
      for (let i = 0; i < count; i++) {
        const obj = objectsRef.current[i];
        material.uniforms.uObjPosRadius.value[i].copy(obj.posRadius);
        material.uniforms.uObjColor.value[i].copy(obj.color);
        material.uniforms.uMass.value[i] = obj.mass;
      }
    }

    // 렌더링
    rendererRef.current.clear();
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    animationIdRef.current = requestAnimationFrame(animate);
  }, [updateGravitySimulation]);

  /**
   * 마우스 이벤트 핸들러
   */
  const handleMouseMove = useCallback((event: MouseEvent) => {
    orbitCameraRef.current.processMouseMove(event.clientX, event.clientY);
  }, []);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    const camera = orbitCameraRef.current;
    camera.processMouseButton(0, 'press');
    camera.lastX = event.clientX;
    camera.lastY = event.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    orbitCameraRef.current.processMouseButton(0, 'release');
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    orbitCameraRef.current.processScroll(event.deltaY);
  }, []);

  /**
   * 중력 토글 함수
   */
  const toggleGravity = useCallback(() => {
    setGravityState(prev => !prev);
  }, []);

  /**
   * 초기화 Effect
   */
  useEffect(() => {
    initializeThreeJS();
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
    };
  }, [initializeThreeJS]);

  /**
   * 렌더링 오브젝트 생성 Effect
   */
  useEffect(() => {
    if (isInitialized) {
      createRenderObjects();
    }
  }, [isInitialized, createRenderObjects]);

  /**
   * 애니메이션 시작 Effect
   */
  useEffect(() => {
    if (isInitialized) {
      animationIdRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized, animate]);

  /**
   * 마우스 이벤트 리스너 Effect
   */
  useEffect(() => {
    const canvas = rendererRef.current?.domElement;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('wheel', handleWheel);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [isInitialized, handleMouseDown, handleMouseMove, handleMouseUp, handleWheel]);

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Three.js 렌더링 영역 */}
      <div ref={mountRef} style={{ width: `100%`, height: `100%` }} />
      
      {/* 컨트롤 UI */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        padding: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        borderRadius: 8,
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '12px',
        border: '1px solid #333'
      }}>
        <div style={{ marginBottom: 10 }}>
          <strong>Black Hole Simulation</strong>
        </div>
        
        <button
          onClick={toggleGravity}
          style={{
            backgroundColor: gravityState ? '#4CAF50' : '#f44336',
            color: 'white',
            border: 'none',
            padding: '8px 12px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: '11px',
            marginBottom: 8
          }}
        >
          Gravity: {gravityState ? 'ON' : 'OFF'}
        </button>
        
        <div style={{ fontSize: '10px', color: '#ccc' }}>
          <div>Camera Distance: {(orbitCameraRef.current.radius / 1e10).toFixed(1)} × 10¹⁰m</div>
          <div>Schwarzschild Radius: {(SagA.r_s / 1e9).toFixed(1)} × 10⁹m</div>
          <div>Controls: Mouse drag to orbit, wheel to zoom</div>
        </div>
      </div>
    </div>
  );
};

export default BlackHoleEngine;