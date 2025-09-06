import * as THREE from 'three';

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
  const float D_LAMBDA = 1e7;
  const float ESCAPE_R = 1e30;
  
  // Global variables for hit info
  vec4 objectColor = vec4(0.0);
  vec3 hitCenter = vec3(0.0);
  float hitRadius = 0.0;
  
  // Ray structure
  struct Ray {
    float x, y, z, r, theta, phi;
    float dr, dtheta, dphi;
    float E, L;
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

    float dx = dir.x, dy = dir.y, dz = dir.z;
    ray.dr = sin(ray.theta)*cos(ray.phi)*dx + sin(ray.theta)*sin(ray.phi)*dy + cos(ray.theta)*dz;
    ray.dtheta = (cos(ray.theta)*cos(ray.phi)*dx + cos(ray.theta)*sin(ray.phi)*dy - sin(ray.theta)*dz) / ray.r;
    ray.dphi = (-sin(ray.phi)*dx + cos(ray.phi)*dy) / (ray.r * sin(ray.theta));

    ray.L = ray.r * ray.r * sin(ray.theta) * ray.dphi;
    float f = 1.0 - SagA_rs / ray.r;
    float dt_dL = sqrt((ray.dr*ray.dr)/f + ray.r*ray.r*(ray.dtheta*ray.dtheta + sin(ray.theta)*sin(ray.theta)*ray.dphi*ray.dphi));
    ray.E = f * dt_dL;

    return ray;
  }
  
  // Black hole intercept check
  bool intercept(Ray ray, float rs) {
    return ray.r <= rs;
  }
  
  // Object intercept check
  bool interceptObject(Ray ray) {
    vec3 P = vec3(ray.x, ray.y, ray.z);
    for (int i = 0; i < 16; ++i) {
      if (i >= uNumObjects) break;
      vec3 center = uObjPosRadius[i].xyz;
      float radius = uObjPosRadius[i].w;
      if (distance(P, center) <= radius) {
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
    float r = ray.r, theta = ray.theta;
    float dr = ray.dr, dtheta = ray.dtheta, dphi = ray.dphi;
    float f = 1.0 - SagA_rs / r;
    float dt_dL = ray.E / f;

    d1 = vec3(dr, dtheta, dphi);
    d2.x = - (SagA_rs / (2.0 * r*r)) * f * dt_dL * dt_dL
         + (SagA_rs / (2.0 * r*r * f)) * dr * dr
         + r * (dtheta*dtheta + sin(theta)*sin(theta)*dphi*dphi);
    d2.y = -2.0*dr*dtheta/r + sin(theta)*cos(theta)*dphi*dphi;
    d2.z = -2.0*dr*dphi/r - 2.0*cos(theta)/(sin(theta)) * dtheta * dphi;
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

    ray.x = ray.r * sin(ray.theta) * cos(ray.phi);
    ray.y = ray.r * sin(ray.theta) * sin(ray.phi);
    ray.z = ray.r * cos(ray.theta);
  }
  
  // Check if ray crosses equatorial plane
  bool crossesEquatorialPlane(vec3 oldPos, vec3 newPos) {
    bool crossed = (oldPos.y * newPos.y < 0.0);
    float r = length(vec2(newPos.x, newPos.z));
    return crossed && (r >= uDiskR1 && r <= uDiskR2);
  }
  
  void main() {
    // Resolution handling
    int WIDTH  = uMoving ? 200 : 200;
    int HEIGHT = uMoving ? 150 : 150;

    ivec2 pix = ivec2(gl_FragCoord.xy);
    if (pix.x >= WIDTH || pix.y >= HEIGHT) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Initialize Ray
    float u = (2.0 * (float(pix.x) + 0.5) / float(WIDTH) - 1.0) * uAspect * uTanHalfFov;
    float v = (1.0 - 2.0 * (float(pix.y) + 0.5) / float(HEIGHT)) * uTanHalfFov;
    vec3 dir = normalize(u * uCamRight - v * uCamUp + uCamForward);
    Ray ray = initRay(uCamPos, dir);

    vec4 color = vec4(0.0);
    vec3 prevPos = vec3(ray.x, ray.y, ray.z);
    float lambda = 0.0;

    bool hitBlackHole = false;
    bool hitDisk      = false;
    bool hitObject    = false;

    int steps = uMoving ? 30000 : 60000; // Fragment shader에서는 단계 수 줄임

    // Main geodesic integration loop
    for (int i = 0; i < 60000; ++i) {
      if (i >= steps) break;
      
      if (intercept(ray, SagA_rs)) { 
        hitBlackHole = true; 
        break; 
      }
      
      rk4Step(ray, D_LAMBDA);
      lambda += D_LAMBDA;

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
      if (ray.r > ESCAPE_R) break;
    }

    // Color calculation (C++의 색상 계산과 동일)
    if (hitDisk) {
      float r = length(vec3(ray.x, ray.y, ray.z)) / uDiskR2;
      vec3 diskColor = vec3(1.0, r, 0.2);
      color = vec4(diskColor, r);

    } else if (hitBlackHole) {
      color = vec4(0.0, 0.0, 0.0, 1.0);

    } else if (hitObject) {
      // Compute shading (C++의 쉐이딩과 동일)
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
export function createGeodesicMaterial(): THREE.ShaderMaterial {
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
      
      // Disk uniforms
      uDiskR1: { value: 1.269e10 * 2.2 }, // SagA_rs * 2.2
      uDiskR2: { value: 1.269e10 * 5.2 }, // SagA_rs * 5.2
      uDiskNum: { value: 2.0 },
      uThickness: { value: 1e9 },
      
      // Objects uniforms
      uNumObjects: { value: 0 },
      uObjPosRadius: { value: [] },
      uObjColor: { value: [] },
      uMass: { value: [] }
    },
    vertexShader: geodesicVertexShader,
    fragmentShader: geodesicFragmentShader
  });
}