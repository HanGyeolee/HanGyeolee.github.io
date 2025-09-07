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
  
  varying vec2 vUv;
  
  // Constants
  const float SagA_rs = 1.269e10;
  const float SagA_rs_half = 6.345e9;        // SagA_rs / 2.0
  const float SagA_rs_sq = 1.610361e20;      // SagA_rs * SagA_rs
  const float D_LAMBDA = 5e7;
  const float D_LAMBDA_SQ = 2.5e15;            // D_LAMBDA * D_LAMBDA
  const float ESCAPE_R = 1e30;
  const float ESCAPE_R_SQ = 1e60;            // ESCAPE_R * ESCAPE_R
  const float TWO = 2.0;

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

    // 캐시된 값들 계산
    ray.r_sq = ray.r * ray.r;
    ray.inv_r = 1.0 / ray.r;
    ray.f = 1.0 - SagA_rs * ray.inv_r;

    ray.theta = acos(pos.z / ray.r);
    ray.phi = atan(pos.y, pos.x);

    // 삼각함수 값들 미리 계산
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
  
  // RK4 integration step
  void rk4Step(inout Ray ray, float dL) {
    vec3 k1a, k1b;
    geodesicRHS(ray, k1a, k1b);

    ray.r      += dL * k1a.x;
    ray.theta  += dL * k1a.y;
    ray.phi    += dL * k1a.z;
    ray.dr     += dL * k1b.x;
    ray.dtheta += dL * k1b.y;
    ray.dphi   += dL * k1b.z;

    // 캐시된 값들 업데이트
    ray.r_sq = ray.r * ray.r;
    ray.inv_r = 1.0 / ray.r;
    ray.f = 1.0 - SagA_rs * ray.inv_r;
    ray.sin_theta = sin(ray.theta);
    ray.cos_theta = cos(ray.theta);
    ray.sin_phi = sin(ray.phi);
    ray.cos_phi = cos(ray.phi);
    ray.sin_theta_sq = ray.sin_theta * ray.sin_theta;

    ray.x = ray.r * ray.sin_theta * ray.cos_phi;
    ray.y = ray.r * ray.sin_theta * ray.sin_phi;
    ray.z = ray.r * ray.cos_theta;
  }
  
  // Check if ray crosses equatorial plane
  bool crossesEquatorialPlane(vec3 oldPos, vec3 newPos) {
    bool crossed = (oldPos.y * newPos.y < 0.0);
    if (!crossed) return false;  // 조기 종료

    // 제곱 거리 비교로 sqrt 제거
    float r_sq = newPos.x * newPos.x + newPos.z * newPos.z;
    return (r_sq >= uDiskR1_sq && r_sq <= uDiskR2_sq);
  }
  
  void main() {
    // Resolution handling
    int WIDTH  = uMoving ? 200 : int(uResolution.x);
    int HEIGHT = uMoving ? 150 : int(uResolution.y);

    ivec2 pix = ivec2(gl_FragCoord.xy);
    if (pix.x >= WIDTH || pix.y >= HEIGHT) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Initialize Ray
    float pixelX = float(pix.x) + 0.5;
    float pixelY = float(pix.y) + 0.5;
    float u = (TWO * pixelX / float(WIDTH) - 1.0) * uAspect * uTanHalfFov;
    float v = (1.0 - TWO * pixelY / float(HEIGHT)) * uTanHalfFov;

    vec3 dir = normalize(u * uCamRight - v * uCamUp + uCamForward);
    Ray ray = initRay(uCamPos, dir);

    vec4 color = vec4(0.0);
    vec3 prevPos = vec3(ray.x, ray.y, ray.z);

    bool hitBlackHole = false;
    bool hitDisk      = false;
    bool hitObject    = false;

    int steps = uMoving ? 12000 : uSteps; // Fragment shader에서는 단계 수 줄임

    // Main geodesic integration loop
    for (int i = 0; i < 30000; ++i) {
      if (i >= steps) break;
      
      if (ray.r > ESCAPE_R) break;

      if (intercept(ray, SagA_rs_sq)) { 
        hitBlackHole = true; 
        break; 
      }
      
      rk4Step(ray, D_LAMBDA);

      vec3 newPos = vec3(ray.x, ray.y, ray.z);
      if (crossesEquatorialPlane(prevPos, newPos)) { 
        hitDisk = true; 
        break; 
      }
      if (interceptObject(ray)) { 
        hitObject = true; 
        break; 
      }
      prevPos = newPos;
    }

    // Color calculation
    if (hitDisk) {
      float r = length(vec3(ray.x, ray.y, ray.z)) * uInvDiskR2;
      vec3 diskColor = vec3(1.0, r, 0.2);
      color = vec4(diskColor, r);

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

    } else {
      color = vec4(0.0);
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
    },
    vertexShader: geodesicVertexShader,
    fragmentShader: geodesicFragmentShader,
    transparent: true,
    alphaTest: 0.001,
    blending: THREE.NormalBlending,
    depthTest: false,
  });
}