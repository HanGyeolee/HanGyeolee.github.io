import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Physics } from './Physics.tsx';
import { ObjectData, SagA, defaultObjects } from './BlackHoleStructs.tsx';
import { createGeodesicMaterial, TileRenderer } from './GeodesicShader.tsx';

/**
 * 카메라 클래스 - 블랙홀 중심 궤도 카메라
 */
class OrbitCamera {
  /** 카메라가 바라보는 목표점 (항상 블랙홀 중심) */
  public target: THREE.Vector3 = new THREE.Vector3(0.0, 0.0, 0.0);
  
  /** 블랙홀로부터의 거리 (m) */
  public radius: number = 1.268388e11;
  
  /** 최소/최대 거리 제한 (m) */
  public minRadius: number = 4e10;
  public maxRadius: number = 1e12;
  
  /** 구면 좌표 (radians) */
  public azimuth: number = -Physics.M_PI / 2.0;
  public elevation: number = Physics.M_PI / 2.0 - Physics.M_PI / 16.0;
  
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
  maxSteps = 12000,
  objects = defaultObjects,
}) => {
  const [computeSize, setComputSize] = useState<{width:number, height:number}>({
    width: width * 0.125,
    height: height * 0.125
  });
  // React refs
  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitCameraRef = useRef<OrbitCamera>(new OrbitCamera());
  const animationIdRef = useRef<number | null>(null);

  // 해상도별
  const lowResRenderTargetRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const upscaleQuadRef = useRef<THREE.Mesh | null>(null);
  const lowResSceneRef = useRef<THREE.Scene | null>(null);
  const lowResCameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // 타일 렌더링용 추가 state
  const tileRendererRef = useRef<TileRenderer | null>(null);
  const accumBufferRef = useRef<THREE.WebGLRenderTarget | null>(null);
  const [renderingProgress, setRenderingProgress] = useState(0);
  const [isHighResRendering, setIsHighResRendering] = useState(false);

  // 상태
  const [isInitialized, setIsInitialized] = useState(false);

  // 렌더링 오브젝트
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
    material.uniforms.uResolution.value.set(width, height);
    material.uniforms.uAspect.value = width / height;
    material.uniforms.uSteps.value = maxSteps;

    return new THREE.Mesh(geometry, material);
  }, [width, height, maxSteps]);

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
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
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
    const camera = new THREE.PerspectiveCamera(60, width / height, 1e3, 1e14);

    // 2. 낮은 해상도 씬과 카메라
    const lowResScene = new THREE.Scene();
    lowResScene.background = null;
    const lowResCamera = new THREE.PerspectiveCamera(60, width / height, 1e3, 1e14);

    // DOM에 추가
    mountRef.current.appendChild(renderer.domElement);

    // Refs 저장
    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;
    lowResSceneRef.current = lowResScene;
    lowResCameraRef.current = lowResCamera;

    setIsInitialized(true);
  }, [width, height]);

  /**
   * 낮은 해상도 render target과 upscale quad 생성
   */
  const createRenderTargets = useCallback(() => {
    if (!rendererRef.current) return;

    // 1. 200x150 render target 생성
    const lowResTarget = new THREE.WebGLRenderTarget(
      computeSize.width, 
      computeSize.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    lowResRenderTargetRef.current = lowResTarget;

    if (lowResSceneRef.current) {
      // 2. geodesic 쿼드를 낮은 해상도 씬에 추가
      const geodesicQuad = createRayTracingQuad();
      lowResSceneRef.current.add(geodesicQuad);
      rayTracingQuadRef.current = geodesicQuad;
    }

    // 4. upscale용 full screen quad 생성
    const upscaleGeometry = new THREE.PlaneGeometry(1, 1);
    const upscaleMaterial = new THREE.MeshBasicMaterial({
      map: lowResTarget.texture,
      transparent: true,
      alphaTest: 0.001,
      depthTest: false,
      depthWrite: false,
    });
    const upscaleQuad = new THREE.Mesh(upscaleGeometry, upscaleMaterial);
    upscaleQuad.renderOrder = 1000;
    upscaleQuadRef.current = upscaleQuad;

    // 5. 메인 씬에 grid 추가
    if (sceneRef.current) {
      sceneRef.current.add(upscaleQuad);

      const gridGeometry = generateGrid(objectsRef.current);
      const gridMaterial = new THREE.LineBasicMaterial({ 
        color: 0x333333, 
        transparent: true, 
        opacity: 0.6,
      });
      const grid = new THREE.LineSegments(gridGeometry, gridMaterial);
      grid.renderOrder = -1000;
      sceneRef.current.add(grid);
      gridRef.current = grid;
    }
  }, [width, height, createRayTracingQuad, generateGrid]);

  /**
   * 카메라 앞에 화면을 가득 채우는 quad 크기 계산
   */
  const calculateQuadSizeAndPosition = useCallback((camera: THREE.PerspectiveCamera, distance: number) => {
    const fov = camera.fov * Math.PI / 180; // radians로 변환
    const aspect = camera.aspect;
    
    // 주어진 거리에서 화면을 가득 채우는 크기 계산
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * aspect;
    
    return { width, height, distance };
  }, []);

  /**
   * 낮은 해상도 렌더링 루프
   */
  const lowAnimate = useCallback((timestamp: number) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    if (!lowResRenderTargetRef.current || !lowResSceneRef.current || !lowResCameraRef.current) return;

    // 궤도 카메라 업데이트
    const orbitCamera = orbitCameraRef.current;
    orbitCamera.update();
    
    const cameraPos = orbitCamera.position();
    cameraRef.current.position.copy(cameraPos);
    cameraRef.current.lookAt(orbitCamera.target);
    
    lowResCameraRef.current.position.copy(cameraPos);
    lowResCameraRef.current.lookAt(orbitCamera.target);
    lowResCameraRef.current.updateProjectionMatrix();

    if(upscaleQuadRef.current){
      const quadDistance = 2000; // 카메라로부터 가까운 거리
      const { width: quadWidth, height: quadHeight } = calculateQuadSizeAndPosition(cameraRef.current, quadDistance);
      
      // quad를 카메라 앞에 배치
      const cameraDir = orbitCamera.target.clone().sub(cameraPos).normalize();
      const quadPosition = cameraPos.clone().add(cameraDir.multiplyScalar(quadDistance));
      
      upscaleQuadRef.current.position.copy(quadPosition);
      upscaleQuadRef.current.scale.set(quadWidth, quadHeight, 1);
      upscaleQuadRef.current.lookAt(cameraPos);
    }

    // 레이 트레이싱 쉐이더 유니폼 업데이트
    if (rayTracingQuadRef.current) {
      const material = rayTracingQuadRef.current.material as THREE.ShaderMaterial;

      // Render target 크기 변경이 필요한 경우
      material.uniforms.uResolution.value.set(computeSize.width, computeSize.height);

      // 시간 업데이트
      material.uniforms.uTime.value = timestamp * 0.001;
      // 카메라 정보 업데이트
      material.uniforms.uCamPos.value.copy(cameraPos);
      material.uniforms.uTileMode.value = false;
      
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

    rendererRef.current.clear();

    // 1단계: lowRes로 geodesic 렌더링
    rendererRef.current.setRenderTarget(lowResRenderTargetRef.current);
    rendererRef.current.setClearColor(0x000000, 0); // 투명 clear 강제
    rendererRef.current.clear(true, true, false); // color, depth clear, stencil no
    rendererRef.current.render(lowResSceneRef.current, lowResCameraRef.current);

    // 메인 화면에 표시
    if (upscaleQuadRef.current) {
      const material = upscaleQuadRef.current.material as THREE.MeshBasicMaterial;
      material.map = lowResRenderTargetRef.current.texture;
    }

    // 2단계: 격자 렌더링
    rendererRef.current.setRenderTarget(null);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    if (orbitCamera.moving){
      animationIdRef.current = requestAnimationFrame(lowAnimate);
    }
  }, []);

  /**
   * 높은 해상도 렌더링, 한 번 만
   */
  const highAnimate = useCallback((timestamp: number) => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    if (!lowResRenderTargetRef.current || !lowResSceneRef.current || !lowResCameraRef.current) return;
    if (!tileRendererRef.current || !accumBufferRef.current) return;

    const tileRenderer = tileRendererRef.current;
    const currentTile = tileRenderer.getCurrentTile();

    if (!currentTile) {
      // 모든 타일 완료
      setIsHighResRendering(false);
      setRenderingProgress(1);
      return;
    }

    setIsHighResRendering(true);

    // 첫 번째 타일인지 확인
    const isFirstTile = tileRenderer.currentTileIndex === 0;

    // 궤도 카메라 업데이트
    const orbitCamera = orbitCameraRef.current;
    orbitCamera.update();
    
    const cameraPos = orbitCamera.position();
    cameraRef.current.position.copy(cameraPos);
    cameraRef.current.lookAt(orbitCamera.target);
    
    lowResCameraRef.current.position.copy(cameraPos);
    lowResCameraRef.current.lookAt(orbitCamera.target);
    lowResCameraRef.current.updateProjectionMatrix();

    if(upscaleQuadRef.current){
      const quadDistance = 2000; // 카메라로부터 가까운 거리
      const { width: quadWidth, height: quadHeight } = calculateQuadSizeAndPosition(cameraRef.current, quadDistance);
      
      // quad를 카메라 앞에 배치
      const cameraDir = orbitCamera.target.clone().sub(cameraPos).normalize();
      const quadPosition = cameraPos.clone().add(cameraDir.multiplyScalar(quadDistance));
      
      upscaleQuadRef.current.position.copy(quadPosition);
      upscaleQuadRef.current.scale.set(quadWidth, quadHeight, 1);
      upscaleQuadRef.current.lookAt(cameraPos);
    }

    // WebGL 컨텍스트 직접 조작으로 타일 영역만 클리어
    const gl = rendererRef.current.getContext() as WebGL2RenderingContext;

    // 첫 번째 타일에서는 lowRes를 accumBuffer에 복사하여 베이스 생성
    if (isFirstTile) {
      // 1-1. lowRes 렌더링
      rendererRef.current.setRenderTarget(lowResRenderTargetRef.current);
      if (rayTracingQuadRef.current) {
        const material = rayTracingQuadRef.current.material as THREE.ShaderMaterial;

        // Render target 크기 변경이 필요한 경우
        material.uniforms.uResolution.value.set(computeSize.width, computeSize.height);

        // 시간 업데이트
        material.uniforms.uTime.value = timestamp * 0.001;
        // 카메라 정보 업데이트
        material.uniforms.uCamPos.value.copy(cameraPos);
        material.uniforms.uTileMode.value = false;
        
        const cameraDir = orbitCamera.target.clone().sub(cameraPos).normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(cameraDir, up).normalize();
        const correctedUp = new THREE.Vector3().crossVectors(right, cameraDir);
        
        material.uniforms.uCamForward.value.copy(cameraDir);
        material.uniforms.uCamRight.value.copy(right);
        material.uniforms.uCamUp.value.copy(correctedUp);
        material.uniforms.uMoving.value = false;
            
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
      rendererRef.current.setClearColor(0x000000, 0);
      rendererRef.current.clear();
      rendererRef.current.render(lowResSceneRef.current, lowResCameraRef.current);

      const sourceFramebuffer = rendererRef.current.properties.get(lowResRenderTargetRef.current).__webglFramebuffer;
      const targetFramebuffer = rendererRef.current.properties.get(accumBufferRef.current).__webglFramebuffer;
      
      // 소스: lowResRenderTarget
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, sourceFramebuffer);
      
      // 대상: accumBuffer
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, targetFramebuffer);
      
      // 업스케일 복사 (LINEAR 필터링으로 부드럽게)
      gl.blitFramebuffer(
        0, 0, computeSize.width, computeSize.height,  // 소스 영역
        0, 0, width, height,                          // 대상 영역 (업스케일)
        gl.COLOR_BUFFER_BIT,
        gl.LINEAR
      );
      
      // 바인딩 해제
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, null);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    }

    // 레이 트레이싱 쉐이더 유니폼 업데이트
    if (rayTracingQuadRef.current) {
      const material = rayTracingQuadRef.current.material as THREE.ShaderMaterial;

      material.uniforms.uResolution.value.set(width, height);

      // 타일 모드 활성화
      material.uniforms.uTileMode.value = true;
      material.uniforms.uTileRect.value.set(
        currentTile.x, 
        currentTile.y, 
        currentTile.width, 
        currentTile.height
      );
    }

    // 1단계: lowRes로 geodesic 렌더링
    rendererRef.current.setRenderTarget(accumBufferRef.current);

    // 현재 Three.js 상태 저장
    const wasScissorEnabled = gl.isEnabled(gl.SCISSOR_TEST);
    const currentScissorBox = gl.getParameter(gl.SCISSOR_BOX);

    // Scissor 테스트 활성화하고 타일 영역 설정
    gl.enable(gl.SCISSOR_TEST);
    gl.scissor(currentTile.x, currentTile.y, currentTile.width, currentTile.height);

    // 해당 타일 영역만 검은색으로 클리어
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Scissor 비활성화 (렌더링은 전체 영역에서)
    gl.disable(gl.SCISSOR_TEST);
    
    // 현재 타일 렌더링
    rendererRef.current.render(lowResSceneRef.current, lowResCameraRef.current);

    // Three.js 상태 복원
    if (wasScissorEnabled) {
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(currentScissorBox[0], currentScissorBox[1], currentScissorBox[2], currentScissorBox[3]);
    }

    // 메인 화면에 표시
    if (upscaleQuadRef.current) {
      const material = upscaleQuadRef.current.material as THREE.MeshBasicMaterial;
      material.map = accumBufferRef.current.texture;
    }

    // 2단계: 격자 렌더링
    rendererRef.current.setRenderTarget(null);
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // 다음 타일로 진행
    const hasMoreTiles = tileRenderer.advance();
    setRenderingProgress(tileRenderer.progress);

    if (hasMoreTiles) {
      // 다음 프레임에서 다음 타일 렌더링
      animationIdRef.current = requestAnimationFrame(highAnimate);
    } else {
      // 렌더링 완료
      setIsHighResRendering(false);
      setRenderingProgress(1);
    }
  }, [width, height]);

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
    // 타일 렌더러 리셋하고 점진적 렌더링 시작
    if (tileRendererRef.current) {
      tileRendererRef.current.reset();
      setRenderingProgress(0);
      setIsHighResRendering(false);
    }
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    animationIdRef.current = requestAnimationFrame(lowAnimate);
  }, []);

  const handleMouseUp = useCallback(() => {
    orbitCameraRef.current.processMouseButton(0, 'release');
    // 타일 렌더러 리셋하고 점진적 렌더링 시작
    if (tileRendererRef.current) {
      tileRendererRef.current.reset();
      setRenderingProgress(0);
    }
    animationIdRef.current = requestAnimationFrame(highAnimate);
  }, []);

  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    orbitCameraRef.current.processScroll(event.deltaY);
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
    animationIdRef.current = requestAnimationFrame(lowAnimate);
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
      createRenderTargets();
    }
  }, [isInitialized, createRenderTargets]);

  /**
   * 크기 변경
   */
  useEffect(() => {
    if (width > 0 && height > 0) {
      tileRendererRef.current = new TileRenderer(width, height, 512);
      
      // 누적 버퍼 생성
      if (rendererRef.current) {
        accumBufferRef.current = new THREE.WebGLRenderTarget(width, height, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
          type: THREE.UnsignedByteType,
        });
      }
    }
    setComputSize({width: width * 0.125, height: height * 0.125})
  }, [width, height]);

  /**
   * 애니메이션 시작 Effect
   */
  useEffect(() => {
    if (isInitialized) {
      animationIdRef.current = requestAnimationFrame(highAnimate);
    }
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [isInitialized, highAnimate]);

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
        right: 10,
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

        {isHighResRendering && (
          <div style={{ marginBottom: 10 }}>
            <div>Rendering: {(renderingProgress * 100).toFixed(1)}%</div>
            <div style={{ 
              width: 200, 
              height: 4, 
              backgroundColor: '#333', 
              borderRadius: 2,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${renderingProgress * 100}%`,
                height: '100%',
                backgroundColor: '#4CAF50',
                transition: 'width 0.1s'
              }} />
            </div>
          </div>
        )}
        
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