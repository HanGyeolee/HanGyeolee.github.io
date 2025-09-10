import * as THREE from 'three';
import { BlackHole } from './BlackHoleStructs.tsx';

export const SCALE_FACTOR = 1e10;

/**
 * Schwarzschild Geodesic Fragment Shader
 * C++의 geodesic.comp를 WebGL fragment shader로 포팅
 */
export const geodesicVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

export const geodesicFragmentShader = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
  
  uniform vec2 uResolution;
  uniform int uSteps;
  uniform float uTime;
  
  // Camera uniforms
  uniform vec3 uCamPos;
  uniform vec3 uCamRight;
  uniform vec3 uCamUp;
  uniform vec3 uCamForward;
  uniform float uTanHalfFov;
  uniform float uAspect;
  uniform bool uMoving;
  
  // Disk uniforms
  uniform float uDiskR1;
  uniform float uDiskR2;
  uniform float uDiskNum;
  
  // Objects uniforms
  uniform int uNumObjects;
  uniform vec4 uObjPosRadius[16];
  uniform vec4 uObjColor[16];

  // 타일 렌더링용 추가 uniforms
  uniform bool uTileMode;
  uniform ivec4 uTileRect; // x, y, width, height
  uniform int uIteration;
  uniform float uMaxIterations_inv; // 1/총 반복 횟수
  
  varying vec2 vUv;
  
  // Constants
  const float SagA_rs = 1.269;  // 1.269e10;
  const float SagA_rs_half = 6.345e-1; // 6.345e9;        // SagA_rs / 2.0
  const float SagA_rs_sq = 1.610361; // 1.610361e20;      // SagA_rs * SagA_rs
  const float D_LAMBDA = 2.5e-3;  // 1e8;
  const float ESCAPE_R = 1e12;  // 1e30;
  const float ESCAPE_R_SQ = 1e24;  // 1e60;            // ESCAPE_R * ESCAPE_R
  const float TWO = 2.0;

  // XYZ를 sRGB로 변환하는 매트릭스
  const mat3 XYZtoRGB = mat3(
    3.2406, -1.5372, -0.4986,
    -0.9689,  1.8758,  0.0415,
    0.0557, -0.2040,  1.0570
  );

  // 미리 계산된 원반 상수들
  uniform float uDiskR1_sq;  // uDiskR1 * uDiskR1 - CPU에서 계산해서 전달
  uniform float uDiskR2_sq;  // uDiskR2 * uDiskR2
  uniform float uInvDiskR2;  // 1.0 / uDiskR2
  
  // Global variables for hit info
  vec4 objectColor = vec4(0.0);
  vec3 hitCenter = vec3(0.0);
  float hitRadius = 0.0;
  
  // Ray structure
  struct Ray {
    float x, y, z, r, theta, phi;
    float dr, dtheta, dphi;
    float E, L;

    // 캐시된 값들
    float r_sq;           // r * r
    float sin_theta;      // sin(theta)
    float cos_theta;      // cos(theta)
    float sin_phi;        // sin(phi)
    float cos_phi;        // cos(phi)
    float sin_theta_sq;   // sin(theta) * sin(theta)
    float inv_r;          // 1.0 / r
    float f;              // 1.0 - SagA_rs / r
  };
  
  // Initialize ray
  Ray initRay(vec3 pos, vec3 dir) {
    Ray ray;
    ray.x = pos.x; 
    ray.y = pos.y; 
    ray.z = pos.z;
    ray.r = length(pos);
    ray.theta = acos(pos.z / ray.r);
    ray.phi = atan(pos.y, pos.x);

    // 캐시된 값들 계산
    ray.r_sq = ray.r * ray.r;
    ray.inv_r = 1.0 / ray.r;
    ray.f = 1.0 - SagA_rs * ray.inv_r;
    ray.sin_theta = sin(ray.theta);
    ray.cos_theta = cos(ray.theta);
    ray.sin_phi = sin(ray.phi);
    ray.cos_phi = cos(ray.phi);
    ray.sin_theta_sq = ray.sin_theta * ray.sin_theta;

    float dx = dir.x, dy = dir.y, dz = dir.z;

    // 사전 계산된 삼각함수 값 사용
    ray.dr = ray.sin_theta * ray.cos_phi * dx + ray.sin_theta * ray.sin_phi * dy + ray.cos_theta * dz;
    ray.dtheta = (ray.cos_theta * ray.cos_phi * dx + ray.cos_theta * ray.sin_phi * dy - ray.sin_theta * dz) * ray.inv_r;
    ray.dphi = (-ray.sin_phi * dx + ray.cos_phi * dy) / (ray.r * ray.sin_theta);

    ray.L = ray.r_sq * ray.sin_theta * ray.dphi;

    float dr_sq = ray.dr * ray.dr;
    float dtheta_sq = ray.dtheta * ray.dtheta;
    float dphi_sq = ray.dphi * ray.dphi;
    float dt_dL = sqrt(dr_sq / ray.f + ray.r_sq * (dtheta_sq + ray.sin_theta_sq * dphi_sq));
    ray.E = ray.f * dt_dL;

    return ray;
  }
  
  // Black hole intercept check
  bool intercept(Ray ray, float rs_sq) {
    return ray.r_sq <= rs_sq * 1.875;
  }
  
  // Object intercept check
  bool interceptObject(Ray ray) {
    vec3 P = vec3(ray.x, ray.y, ray.z);
    for (int i = 0; i < 16; ++i) {
      if (i >= uNumObjects) break;
      vec3 center = uObjPosRadius[i].xyz;
      float radius = uObjPosRadius[i].w;

      vec3 diff = P - center;
      float dist_sq = dot(diff, diff);  // 벡터 내적으로 제곱 거리 계산
      float radius_sq = radius * radius;

      if (dist_sq <= radius_sq) {
        objectColor = uObjColor[i];
        hitCenter = center;
        hitRadius = radius;
        return true;
      }
    }
    return false;
  }
  
  // Geodesic equations RHS
  void geodesicRHS(Ray ray, out vec3 d1, out vec3 d2) {
    float r = ray.r;
    float r_sq = ray.r_sq;
    float theta = ray.theta;
    float dr = ray.dr;
    float dtheta = ray.dtheta;
    float dphi = ray.dphi;
    float f = ray.f;
    float inv_r = ray.inv_r;
    float sin_theta = ray.sin_theta;
    float cos_theta = ray.cos_theta;
    float sin_theta_sq = ray.sin_theta_sq;

    float dt_dL = ray.E / f;
    float dt_dL_sq = dt_dL * dt_dL;
    float dr_sq = dr * dr;
    float dtheta_sq = dtheta * dtheta;
    float dphi_sq = dphi * dphi;

    d1 = vec3(dr, dtheta, dphi);

    float inv_r_sq = inv_r * inv_r;  // 1.0 / (r * r)
    float sagA_term = SagA_rs_half * inv_r_sq;  // SagA_rs / (2.0 * r * r)

    d2.x = - sagA_term  * f * dt_dL_sq
         + sagA_term / f * dr_sq
         + r * (dtheta_sq + sin_theta_sq * dphi_sq);
    d2.y = -TWO * dr * dtheta * inv_r + sin_theta * cos_theta * dphi_sq;
    d2.z = -TWO * dr * dphi * inv_r - TWO * cos_theta / sin_theta * dtheta * dphi;
  }

  // Ray의 캐시된 값들을 업데이트하는 헬퍼 함수
  void updateRayCache(inout Ray ray) {
    ray.r_sq = ray.r * ray.r;
    ray.inv_r = 1.0 / ray.r;
    ray.f = 1.0 - SagA_rs * ray.inv_r;
    ray.sin_theta = sin(ray.theta);
    ray.cos_theta = cos(ray.theta);
    ray.sin_phi = sin(ray.phi);
    ray.cos_phi = cos(ray.phi);
    ray.sin_theta_sq = ray.sin_theta * ray.sin_theta;
    
    // 직교좌표 업데이트
    ray.x = ray.r * ray.sin_theta * ray.cos_phi;
    ray.y = ray.r * ray.sin_theta * ray.sin_phi;
    ray.z = ray.r * ray.cos_theta;
  }

  // RK2 integration step (Midpoint method)
  void rk2Step(inout Ray ray, float dL) {
    vec3 k1a, k1b, k2a, k2b;
    Ray tempRay;

    // k1
    geodesicRHS(ray, k1a, k1b);

    // k2 (중점에서)
    tempRay = ray;
    tempRay.r      += 0.5 * dL * k1a.x;
    tempRay.theta  += 0.5 * dL * k1a.y;
    tempRay.phi    += 0.5 * dL * k1a.z;
    tempRay.dr     += 0.5 * dL * k1b.x;
    tempRay.dtheta += 0.5 * dL * k1b.y;
    tempRay.dphi   += 0.5 * dL * k1b.z;
    updateRayCache(tempRay);
    geodesicRHS(tempRay, k2a, k2b);

    // 최종 업데이트 (k2만 사용)
    ray.r      += dL * k2a.x;
    ray.theta  += dL * k2a.y;
    ray.phi    += dL * k2a.z;
    ray.dr     += dL * k2b.x;
    ray.dtheta += dL * k2b.y;
    ray.dphi   += dL * k2b.z;

    updateRayCache(ray);
  }

  // Check if ray crosses equatorial plane
  bool crossesEquatorialPlane(vec3 oldPos, vec3 newPos) {
    float oldY = oldPos.y;
    float newY = newPos.y;
    
    // Y 좌표 부호 변화 체크 (더 엄격한 조건)
    bool signChange = (oldY > 1e-8 && newY < -1e-8) || (oldY < -1e-8 && newY > 1e-8);
    if (!signChange) return false;
    
    // 선형 보간으로 정확한 교차점 계산
    float t = abs(oldY) / (abs(oldY) + abs(newY)); // 교차 지점의 파라미터
    t = clamp(t, 0.0, 1.0); // 안전성을 위한 클램핑
    
    vec3 crossPoint = mix(oldPos, newPos, t);

    // 교차점에서의 반지름 계산
    float r_cross_sq = crossPoint.x * crossPoint.x + crossPoint.z * crossPoint.z;
    
    // 다중 tolerance 체크로 정밀도 향상
    return (r_cross_sq >= uDiskR1_sq) && (r_cross_sq <= uDiskR2_sq);
  }

  // 플랑크 흑체복사 함수
  vec3 temperatureToRGB(float temp) {
    temp = clamp(temp, 1000.0, 20000.0);
    temp /= 100.0;
    
    vec3 color;
    
    // Red component
    if (temp <= 66.0) {
        color.r = 1.0;
    } else {
        color.r = temp - 60.0;
        color.r = 329.698727446 * pow(color.r, -0.1332047592);
        color.r = clamp(color.r / 255.0, 0.0, 1.0);
    }
    
    // Green component
    if (temp <= 66.0) {
        color.g = temp;
        color.g = 99.4708025861 * log(color.g) - 161.1195681661;
    } else {
        color.g = temp - 60.0;
        color.g = 288.1221695283 * pow(color.g, -0.0755148492);
    }
    color.g = clamp(color.g / 255.0, 0.0, 1.0);
    
    // Blue component
    if (temp >= 66.0) {
        color.b = 1.0;
    } else if (temp <= 19.0) {
        color.b = 0.0;
    } else {
        color.b = temp - 10.0;
        color.b = 138.5177312231 * log(color.b) - 305.0447927307;
        color.b = clamp(color.b / 255.0, 0.0, 1.0);
    }
    
    return color;
  }

  // 강착원반의 회전 속도에 따른 도플러 시프트
  float getDopplerFactor(vec3 P, vec3 velocity, vec3 viewDir) {
    float beta = length(velocity) / 299792458.0; // v/c
    float cosTheta = dot(normalize(velocity), normalize(viewDir));
    
    // 상대론적 도플러 공식
    return sqrt(1.0 - beta*beta) / (1.0 - beta*cosTheta);
  }

  // 중력 적색편이
  float getGravitationalRedshift(float r) {
    return sqrt(1.0 - SagA_rs / r);
  }
  
  // 상대론적 궤도 속도 (Schwarzschild 메트릭)
  vec3 getOrbitalVelocity(vec3 P) {
    float r = length(P);
    
    // 원형 궤도에서의 상대론적 속도
    // v/c = sqrt(rs/(2r)) * sqrt(1/(1-3rs/(2r)))
    float rs_over_2r = SagA_rs / (2.0 * r);
    float correction = 1.0 / sqrt(1.0 - 3.0 * rs_over_2r);
    float v_mag = sqrt(rs_over_2r) * correction;
    
    // ISCO 근처에서는 불안정해짐
    if (r < SagA_rs * 3.0) {
      v_mag *= smoothstep(SagA_rs * 1.5, SagA_rs * 3.0, r);
    }
    
    // 궤도 방향
    vec3 radial = normalize(P);
    vec3 orbital_dir = normalize(cross(radial, vec3(0.0, 0.0, 1.0)));
    
    return v_mag * orbital_dir;
  }

  // 올바른 알파 컴포지팅 함수
  vec4 alphaComposite(vec4 src, vec4 dst) {
    // src: 위에 그려질 색상 (새로운 레이어)
    // dst: 아래 있는 색상 (기존 레이어)
    
    float srcAlpha = src.a;
    float dstAlpha = dst.a;
    
    // 최종 알파값 계산: αₒ = αₛ + αᵈ(1 - αₛ)
    float outAlpha = srcAlpha + dstAlpha * (1.0 - srcAlpha);
    
    if (outAlpha <= 0.0) {
        return vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    // 최종 RGB 계산: Cₒ = (Cₛaₛ + Cᵈaᵈ(1 - aₛ)) / aₒ
    vec3 outRGB = (src.rgb * srcAlpha + dst.rgb * dstAlpha * (1.0 - srcAlpha)) / outAlpha;
    
    return vec4(outRGB, outAlpha);
  }

  vec4 calculateDiskColor(vec3 P, float r, out vec3 viewDir) {
    float physicalRadius = r * ${SCALE_FACTOR.toExponential()};
    float diskProgress = (r - uDiskR1) / (uDiskR2 - uDiskR1);
    diskProgress = clamp(diskProgress, 0.0, 1.0);

    // 온도 계산 - 내부에서 외부로 갈수록 감소
    float innerTemp = 14000.0;  // 내부 온도 (파란색/흰색)
    float outerTemp = 100.0;   // 외부 온도 (빨간색)

    // 부드러운 온도 그라데이션
    float temperature = mix(innerTemp, outerTemp, diskProgress);

    // 궤도 속도 계산
    vec3 velocity = getOrbitalVelocity(P); // 케플러 궤도
    viewDir = normalize(uCamPos - P);

    // 도플러 및 중력 효과
    float doppler = getDopplerFactor(P, velocity, viewDir);
    float redshift = getGravitationalRedshift(r);
    float combinedShift = doppler * redshift;

    // 실제 온도 적용
    float effectiveTemp = temperature * combinedShift;

    // 흑체복사 색상
    vec3 diskColor = temperatureToRGB(effectiveTemp);
    
    // Stefan-Boltzmann 법칙 적용 (밝기 조정)
    float intensity = pow((uDiskR2 - r) / (uDiskR2 - uDiskR1), 0.5) * 0.8;
    diskColor *= intensity;

    // 경계에서 부드러운 페이드
    float innerFade = smoothstep(uDiskR1 * 0.95, uDiskR1 * 1.05, r);
    float outerFade = smoothstep(uDiskR2 * 1.05, uDiskR2 * 0.95, r);
    float fadeFactor = innerFade * outerFade;
    
    // 알파값 계산
    float alpha = fadeFactor * clamp(length(diskColor) * 2.0, 0.0, 0.875);

    return vec4(diskColor, alpha);
  }

  float getAdaptiveStepSize(float r) {
    // 블랙홀 근처에서는 더 작은 스텝
    if (r < uDiskR1) {
        return D_LAMBDA * 0.75;
    }
    // 디스크 근처에서는 중간 크기 스텝
    else if (r <= uDiskR2) {
        return D_LAMBDA * 0.875;
    }
    return D_LAMBDA * 1.25;
  }
  
  void main() {
    // Resolution handling
    int WIDTH  = int(uResolution.x);
    int HEIGHT = int(uResolution.y);

    ivec2 pix = ivec2(gl_FragCoord.xy);

    // 타일 모드에서는 지정된 타일 영역만 렌더링
    if (uTileMode) {
      if (pix.x < uTileRect.x || pix.x >= uTileRect.x + uTileRect.z ||
          pix.y < uTileRect.y || pix.y >= uTileRect.y + uTileRect.w) {
        // 타일 영역 밖이면 아무것도 그리지 않음 (기존 내용 보존)
        discard;
        return;
      }
    }

    if (pix.x >= WIDTH || pix.y >= HEIGHT) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec4 finalColor = vec4(0.0);
    int steps = 24000; // Fragment shader에서는 단계 수 줄임
    if (uTileMode) {
      steps = uSteps;
    }

    // 반복 번호 기반 고정 jitter 패턴
    vec2 jitter = vec2(0.0);
    if (uTileMode) {
      // 반복 번호와 픽셀 좌표를 조합한 결정론적 jitter
      float jitterSeed = float(uIteration) * 73.0 + float(pix.x * 127 + pix.y * 311);
      jitter = vec2(
        fract(sin(jitterSeed) * 43758.5453) - 0.5,
        fract(sin(jitterSeed * 1.61803) * 43758.5453) - 0.5
      ) * 0.5; // jitter 강도 조절
    }

    // 서브픽셀 오프셋
    float subX = float(pix.x) + jitter.x + 0.5;
    float subY = float(pix.y) + jitter.y + 0.5;
    
    float u = (TWO * subX / float(WIDTH) - 1.0) * uAspect * uTanHalfFov;
    float v = (1.0 - TWO * subY / float(HEIGHT)) * uTanHalfFov;
    
    vec3 dir = normalize(u * uCamRight - v * uCamUp + uCamForward);
    Ray ray = initRay(uCamPos, dir);
    
    vec4 color = vec4(0.0);
    vec3 prevPos = vec3(ray.x, ray.y, ray.z);
    vec3 diskPos = vec3(ray.x, ray.y, ray.z);
    vec3 diskPos2 = vec3(ray.x, ray.y, ray.z);

    bool hitBlackHole = false;
    bool hitDisk      = false;
    bool hitDisk2      = false;
    bool hitObject    = false;

    // Main geodesic integration loop
    for (int i = 0; i < steps; ++i) {
      if (ray.r > ESCAPE_R) break;

      float stepSize = getAdaptiveStepSize(ray.r);
      rk2Step(ray, stepSize);

      if (intercept(ray, SagA_rs_sq)) { 
        hitBlackHole = true; 
        break; 
      }

      vec3 newPos = vec3(ray.x, ray.y, ray.z);
      if (crossesEquatorialPlane(prevPos, newPos)) { 
        if(!hitDisk){
          hitDisk = true;
          diskPos = vec3(ray.x, ray.y, ray.z);
        } else if(!hitDisk2){
          hitDisk2 = true;
          diskPos2 = vec3(ray.x, ray.y, ray.z);
          break;
        } 
      }
      if (interceptObject(ray)) { 
        hitObject = true; 
        break; 
      }
      prevPos = newPos;
    }

    // Color calculation
    if (hitDisk) {
      vec3 P = diskPos;
      float r = length(P);
      vec3 viewDir;

      color = calculateDiskColor(P, r, viewDir);
      
      // 총 반복 횟수로 알파값 나누기
      if (uTileMode) {
        float a = color.a;
        float multiplier = (1.0 - pow(1.0 - a, uMaxIterations_inv)) / a;
        color.a *= multiplier;
      }

      if(hitDisk2){
        vec3 P2 = diskPos2;
        float r2 = length(P2);
        vec3 viewDir2;
        vec4 dColor = calculateDiskColor(P2, r2, viewDir2);
        if (uTileMode) {
          float a = dColor.a;
          float multiplier = (1.0 - pow(1.0 - a, uMaxIterations_inv)) / a;
          dColor.a *= multiplier;
        }
        color = alphaComposite(color, dColor);
      }
    }
    
    if(uIteration == 0) {
      if (hitObject) {
        // Compute shading
        vec3 P = vec3(ray.x, ray.y, ray.z);
        vec3 N = normalize(P - hitCenter);
        vec3 V = normalize(uCamPos - P);

        float ambient = 0.1;
        float diff = max(dot(N, V), 0.0);
        float intensity = ambient + (1.0 - ambient) * diff;
        vec3 shaded = objectColor.rgb * intensity;
        vec4 oColor = vec4(shaded, objectColor.a);
        color = alphaComposite(color, oColor);
      }

      if (hitBlackHole) {
        vec4 oColor = vec4(0.0, 0.0, 0.0, 1.0);
        color = alphaComposite(color, oColor);
      }
    }
      
    gl_FragColor = color;
  }
`;

/**
 * Geodesic 쉐이더 머티리얼 생성 함수
 */
export function createGeodesicMaterial(blackhole:BlackHole): THREE.ShaderMaterial {
  const uObjPosRadius:THREE.Vector4[] = [];
  const uObjColor:THREE.Vector4[] = [];
  for(let i = 0; i < 16; i++){
    uObjPosRadius.push(new THREE.Vector4());
    uObjColor.push(new THREE.Vector4());
  }
  const diskR1 = blackhole.r_s * 2.2 / SCALE_FACTOR;
  const diskR2 = blackhole.r_s * 5.2 / SCALE_FACTOR;

  const diskR1_sq = diskR1 * diskR1;
  const diskR2_sq = diskR2 * diskR2;
  const invDiskR2 = 1.0 / diskR2;

  return new THREE.ShaderMaterial({
    uniforms: {
      // Resolution
      uResolution: { value: new THREE.Vector2(800, 600) },
      uTime: { value: 0.0 },
      
      // Camera uniforms
      uCamPos: { value: new THREE.Vector3() },
      uCamRight: { value: new THREE.Vector3() },
      uCamUp: { value: new THREE.Vector3() },
      uCamForward: { value: new THREE.Vector3() },
      uTanHalfFov: { value: Math.tan(Math.PI / 6) }, // 60도의 절반
      uAspect: { value: 800 / 600 },
      uMoving: { value: false },
      uSteps: {value: 6000.0},
      
      // Disk uniforms
      uDiskR1: { value: diskR1 }, // SagA_rs * 2.2
      uDiskR2: { value: diskR2 }, // SagA_rs * 5.2
      uDiskNum: { value: 2.0 },
      
      // Objects uniforms
      uNumObjects: { value: 0 },
      uObjPosRadius: { value: uObjPosRadius },
      uObjColor: { value: uObjColor },

      // Cache
      uDiskR1_sq : {value: diskR1_sq },
      uDiskR2_sq : {value: diskR2_sq },
      uInvDiskR2 : {value: invDiskR2 },

      // 타일 렌더링용 추가
      uTileMode: { value: false },
      uTileRect: { value: new THREE.Vector4(0, 0, 0, 0) },

      // 새로 추가된 반복 기반 uniform
      uIteration: { value: 0 },
      uMaxIterations_inv: { value: 1/4.0 } 
    },
    vertexShader: geodesicVertexShader,
    fragmentShader: geodesicFragmentShader,
    transparent: true,
    alphaTest: 0.001,
  });
}

export class TileRenderer {
  private tileSize: number;
  private tilesX: number;
  private tilesY: number;
  private totalTilesPerIteration: number;
  
  // 반복 관련
  private maxIterations: number;
  private currentIteration: number = 0;
  private currentTileInIteration: number = 0;
  
  // 전체 진행
  public progressIndex: number = 0; // 전체 타일 인덱스
  private totalTiles: number; // 전체 반복 * 타일 개수
  private isCompleted: boolean = false;

  constructor(width: number, height: number, tileSize: number = 64, iterations: number = 4) {
    this.tileSize = tileSize;
    this.tilesX = Math.ceil(width / tileSize);
    this.tilesY = Math.ceil(height / tileSize);
    this.totalTilesPerIteration = this.tilesX * this.tilesY;
    
    this.maxIterations = iterations;
    this.totalTiles = this.totalTilesPerIteration * this.maxIterations;
  }

  reset() {
    this.currentIteration = 0;
    this.currentTileInIteration = 0;
    this.progressIndex = 0;
    this.isCompleted = false;
  }

  getCurrentTile(): { 
    x: number; 
    y: number; 
    width: number; 
    height: number;
    iteration: number;
    maxIteration: number;
    isFirstTileFirstIteration: boolean;
  } | null {
    if (this.isCompleted) return null;

    const tileX = this.currentTileInIteration % this.tilesX;
    const tileY = Math.floor(this.currentTileInIteration / this.tilesX);

    return {
      x: tileX * this.tileSize,
      y: tileY * this.tileSize,
      width: this.tileSize,
      height: this.tileSize,
      iteration: this.currentIteration,
      maxIteration: this.maxIterations,
      isFirstTileFirstIteration: this.currentIteration === 0 && this.currentTileInIteration === 0
    };
  }

  advance(): boolean {
    this.progressIndex++;
    this.currentTileInIteration++;

    // 현재 반복의 모든 타일을 완료했는지 체크
    if (this.currentTileInIteration >= this.totalTilesPerIteration) {
      this.currentIteration++;
      this.currentTileInIteration = 0;

      // 모든 반복을 완료했는지 체크
      if (this.currentIteration >= this.maxIterations) {
        this.isCompleted = true;
        return false;
      }
    }

    return true;
  }

  get progress(): number {
    return this.progressIndex / this.totalTiles;
  }

  get iterationProgress(): number {
    return this.currentTileInIteration / this.totalTilesPerIteration;
  }

  get currentIterationNumber(): number {
    return this.currentIteration;
  }

  get totalIterations(): number {
    return this.maxIterations;
  }

  // 현재 상태 정보
  getStatus(): {
    iteration: number;
    maxIterations: number;
    tileInIteration: number;
    totalTilesPerIteration: number;
    overallProgress: number;
    iterationProgress: number;
  } {
    return {
      iteration: this.currentIteration,
      maxIterations: this.maxIterations,
      tileInIteration: this.currentTileInIteration,
      totalTilesPerIteration: this.totalTilesPerIteration,
      overallProgress: this.progress,
      iterationProgress: this.iterationProgress
    };
  }
}