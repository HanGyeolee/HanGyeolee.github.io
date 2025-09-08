import * as THREE from 'three';
import { BlackHole } from './BlackHoleStructs.tsx';

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
  precision highp float;
  
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
  uniform float uThickness;
  
  // Objects uniforms
  uniform int uNumObjects;
  uniform vec4 uObjPosRadius[16];
  uniform vec4 uObjColor[16];
  uniform float uMass[16];

  // 타일 렌더링용 추가 uniforms
  uniform bool uTileMode;
  uniform ivec4 uTileRect; // x, y, width, height
  
  varying vec2 vUv;
  
  // Constants
  const float SagA_rs = 1.269e10;
  const float SagA_rs_half = 6.345e9;        // SagA_rs / 2.0
  const float SagA_rs_sq = 1.610361e20;      // SagA_rs * SagA_rs
  const float D_LAMBDA = 1e8;
  const float D_LAMBDA_SQ = 1e16;            // D_LAMBDA * D_LAMBDA
  const float ESCAPE_R = 1e30;
  const float ESCAPE_R_SQ = 1e60;            // ESCAPE_R * ESCAPE_R
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
    return ray.r_sq <= rs_sq;
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

  // RK3 integration step
  void rk3Step(inout Ray ray, float dL) {
    vec3 k1a, k1b, k2a, k2b, k3a, k3b;
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

    // k3
    tempRay = ray;
    tempRay.r      += dL * (-k1a.x + 2.0 * k2a.x);
    tempRay.theta  += dL * (-k1a.y + 2.0 * k2a.y);
    tempRay.phi    += dL * (-k1a.z + 2.0 * k2a.z);
    tempRay.dr     += dL * (-k1b.x + 2.0 * k2b.x);
    tempRay.dtheta += dL * (-k1b.y + 2.0 * k2b.y);
    tempRay.dphi   += dL * (-k1b.z + 2.0 * k2b.z);
    updateRayCache(tempRay);
    geodesicRHS(tempRay, k3a, k3b);

    // 업데이트 (k1 + 4*k2 + k3) / 6
    ray.r      += dL * (k1a.x + 4.0 * k2a.x + k3a.x) / 6.0;
    ray.theta  += dL * (k1a.y + 4.0 * k2a.y + k3a.y) / 6.0;
    ray.phi    += dL * (k1a.z + 4.0 * k2a.z + k3a.z) / 6.0;
    ray.dr     += dL * (k1b.x + 4.0 * k2b.x + k3b.x) / 6.0;
    ray.dtheta += dL * (k1b.y + 4.0 * k2b.y + k3b.y) / 6.0;
    ray.dphi   += dL * (k1b.z + 4.0 * k2b.z + k3b.z) / 6.0;

    updateRayCache(ray);
  }

  // RK4 integration step
  void rk4Step(inout Ray ray, float dL) {
    vec3 k1a, k1b, k2a, k2b, k3a, k3b, k4a, k4b;
    Ray tempRay;

    // k1
    geodesicRHS(ray, k1a, k1b);
 
    // k2
    tempRay = ray;
    tempRay.r      += 0.5 * dL * k1a.x;
    tempRay.theta  += 0.5 * dL * k1a.y;
    tempRay.phi    += 0.5 * dL * k1a.z;
    tempRay.dr     += 0.5 * dL * k1b.x;
    tempRay.dtheta += 0.5 * dL * k1b.y;
    tempRay.dphi   += 0.5 * dL * k1b.z;
    updateRayCache(tempRay);
    geodesicRHS(tempRay, k2a, k2b);
    
    // k3
    tempRay = ray;
    tempRay.r      += 0.5 * dL * k2a.x;
    tempRay.theta  += 0.5 * dL * k2a.y;
    tempRay.phi    += 0.5 * dL * k2a.z;
    tempRay.dr     += 0.5 * dL * k2b.x;
    tempRay.dtheta += 0.5 * dL * k2b.y;
    tempRay.dphi   += 0.5 * dL * k2b.z;
    updateRayCache(tempRay);
    geodesicRHS(tempRay, k3a, k3b);
    
    // k4
    tempRay = ray;
    tempRay.r      += dL * k3a.x;
    tempRay.theta  += dL * k3a.y;
    tempRay.phi    += dL * k3a.z;
    tempRay.dr     += dL * k3b.x;
    tempRay.dtheta += dL * k3b.y;
    tempRay.dphi   += dL * k3b.z;
    updateRayCache(tempRay);
    geodesicRHS(tempRay, k4a, k4b);
    
    // 업데이트
    ray.r      += dL * (k1a.x + 2.0 * k2a.x + 2.0 * k3a.x + k4a.x) / 6.0;
    ray.theta  += dL * (k1a.y + 2.0 * k2a.y + 2.0 * k3a.y + k4a.y) / 6.0;
    ray.phi    += dL * (k1a.z + 2.0 * k2a.z + 2.0 * k3a.z + k4a.z) / 6.0;
    ray.dr     += dL * (k1b.x + 2.0 * k2b.x + 2.0 * k3b.x + k4b.x) / 6.0;
    ray.dtheta += dL * (k1b.y + 2.0 * k2b.y + 2.0 * k3b.y + k4b.y) / 6.0;
    ray.dphi   += dL * (k1b.z + 2.0 * k2b.z + 2.0 * k3b.z + k4b.z) / 6.0;
    
    updateRayCache(ray);
  }
  
  // Check if ray crosses equatorial plane
  bool crossesEquatorialPlane(vec3 oldPos, vec3 newPos) {
    bool crossed = (oldPos.y * newPos.y < 0.0);
    if (!crossed) return false;  // 조기 종료

    // 제곱 거리 비교로 sqrt 제거
    float r_sq = newPos.x * newPos.x + newPos.z * newPos.z;
    return (r_sq >= uDiskR1_sq && r_sq <= uDiskR2_sq);
  }

  // 플랑크 흑체복사 함수
  vec3 temperatureToRGB(float temp) {
    temp = clamp(temp, 1000.0, 40000.0);
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
    
    // 최종 RGB 계산: Cₒ = (Cₛαₛ + Cᵈαᵈ(1 - αₛ)) / αₒ
    vec3 outRGB = (src.rgb * srcAlpha + dst.rgb * dstAlpha * (1.0 - srcAlpha)) / outAlpha;
    
    return vec4(outRGB, outAlpha);
  }

  vec4 calculateDiskColor(vec3 P, float r, out vec3 viewDir) {
    float diskProgress = (r - uDiskR1) / (uDiskR2 - uDiskR1);
    diskProgress = clamp(diskProgress, 0.0, 1.0);

    // 온도 계산 - 내부에서 외부로 갈수록 감소
    float innerTemp = 6000.0;  // 내부 온도 (파란색/흰색)
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
    int samples = 3; // 2x2 샘플링

    for (int sx = 0; sx < samples; sx++) {
      for (int sy = 0; sy < samples; sy++) {
        // 서브픽셀 오프셋
        float subX = float(pix.x) + (float(sx) + 0.5) / float(samples);
        float subY = float(pix.y) + (float(sy) + 0.5) / float(samples);
        
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

        int steps = uMoving ? 6000 : uSteps; // Fragment shader에서는 단계 수 줄임

        // Main geodesic integration loop
        for (int i = 0; i < 12000; ++i) {
          if (i >= steps) break;
          
          if (ray.r > ESCAPE_R) break;

          if (intercept(ray, SagA_rs_sq)) { 
            hitBlackHole = true; 
            break; 
          }

          if (uTileMode) {
            rk4Step(ray, D_LAMBDA);
          } else {
            rk2Step(ray, D_LAMBDA);
          }

          vec3 newPos = vec3(ray.x, ray.y, ray.z);
          if (crossesEquatorialPlane(prevPos, newPos)) { 
            if(!hitDisk){
              hitDisk = true;
              diskPos = vec3(ray.x, ray.y, ray.z);
            } else if(!hitDisk2){
              hitDisk2 = true;
              diskPos2 = vec3(ray.x, ray.y, ray.z);
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

          vec4 dColor = calculateDiskColor(P, r, viewDir);
          if(hitDisk2){
            vec3 P2 = diskPos2;
            float r2 = length(P2);
            vec3 viewDir2;
            vec4 dColor2 = calculateDiskColor(P2, r2, viewDir2);

            dColor = alphaComposite(dColor, dColor2);
          }

          if (hitBlackHole) {
            vec4 oColor = vec4(0.0, 0.0, 0.0, 1.0);
            color = alphaComposite(dColor, oColor);
          } else if (hitObject) {
            vec3 N = normalize(P - hitCenter);
            vec3 V = viewDir;

            float ambient = 0.1;
            float diff = max(dot(N, V), 0.0);
            float intensity = ambient + (1.0 - ambient) * diff;
            vec3 shaded = objectColor.rgb * intensity;
            vec4 oColor = vec4(shaded, objectColor.a);
            color = alphaComposite(dColor, oColor);
          } else {
            color = dColor;
          }
        } else if (hitBlackHole) {
          color = vec4(0.0, 0.0, 0.0, 1.0);
        } else if (hitObject) {
          // Compute shading
          vec3 P = vec3(ray.x, ray.y, ray.z);
          vec3 N = normalize(P - hitCenter);
          vec3 V = normalize(uCamPos - P);

          float ambient = 0.1;
          float diff = max(dot(N, V), 0.0);
          float intensity = ambient + (1.0 - ambient) * diff;
          vec3 shaded = objectColor.rgb * intensity;
          color = vec4(shaded, objectColor.a);
        }
        
        finalColor += color; // 각 샘플의 색상 누적
      }
    }

    gl_FragColor = finalColor / float(samples * samples);
  }
`;

/**
 * Geodesic 쉐이더 머티리얼 생성 함수
 */
export function createGeodesicMaterial(blackhole:BlackHole): THREE.ShaderMaterial {
  const uObjPosRadius:THREE.Vector4[] = [];
  const uObjColor:THREE.Vector4[] = [];
  const uMass:number[] = [];
  for(let i = 0; i < 16; i++){
    uObjPosRadius.push(new THREE.Vector4());
    uObjColor.push(new THREE.Vector4());
    uMass.push(0.0);
  }
  const diskR1 = blackhole.r_s * 2.2;
  const diskR2 = blackhole.r_s * 5.2;

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
      uSteps: {value: 60000.0},
      
      // Disk uniforms
      uDiskR1: { value: diskR1 }, // SagA_rs * 2.2
      uDiskR2: { value: diskR2 }, // SagA_rs * 5.2
      uDiskNum: { value: 2.0 },
      uThickness: { value: 1e9 },
      
      // Objects uniforms
      uNumObjects: { value: 0 },
      uObjPosRadius: { value: uObjPosRadius },
      uObjColor: { value: uObjColor },
      uMass: { value: uMass },

      // Cache
      uDiskR1_sq : {value: diskR1_sq },
      uDiskR2_sq : {value: diskR2_sq },
      uInvDiskR2 : {value: invDiskR2 },

      // 타일 렌더링용 추가
      uTileMode: { value: false },
      uTileRect: { value: new THREE.Vector4(0, 0, 0, 0) },
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
  public currentTileIndex: number = 0;
  private totalTiles: number;
  private isCompleted: boolean = false;

  constructor(width: number, height: number, tileSize: number = 64) {
    this.tileSize = tileSize;
    this.tilesX = Math.ceil(width / tileSize);
    this.tilesY = Math.ceil(height / tileSize);
    this.totalTiles = this.tilesX * this.tilesY;
  }

  reset() {
    this.currentTileIndex = 0;
    this.isCompleted = false;
  }

  getCurrentTile(): { x: number; y: number; width: number; height: number } | null {
    if (this.isCompleted) return null;

    const tileX = this.currentTileIndex % this.tilesX;
    const tileY = Math.floor(this.currentTileIndex / this.tilesX);

    return {
      x: tileX * this.tileSize,
      y: tileY * this.tileSize,
      width: this.tileSize,
      height: this.tileSize
    };
  }

  advance(): boolean {
    this.currentTileIndex++;
    if (this.currentTileIndex >= this.totalTiles) {
      this.isCompleted = true;
      return false;
    }
    return true;
  }

  get progress(): number {
    return this.currentTileIndex / this.totalTiles;
  }
}