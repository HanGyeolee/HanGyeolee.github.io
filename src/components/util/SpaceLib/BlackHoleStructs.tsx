import * as THREE from 'three';
import { Physics } from './Physics.tsx';

export class BlackHole {
    /** 블랙홀의 위치 (m) */
    public position: THREE.Vector3;
    /** 블랙홀의 질량 (kg) */
    public mass: number;
    /** 블랙홀의 표시 반지름 (m) */
    public radius: number;
    /** 슈바르츠실트 반지름 (사건의 지평선) (m) */
    public r_s: number;
    private r_s_2: number;

    /**
     * 블랙홀 생성자
     * @param pos 블랙홀의 위치
     * @param m 블랙홀의 질량 (kg)
     */
    constructor(pos:THREE.Vector3, m:number) {
        this.position = pos;
        this.mass = m;
        // 슈바르츠실트 반지름 계산: r_s = 2GM/c²
        this.r_s = 2.0 * Physics.G * m / (Physics.c_2);
        this.r_s_2 = this.r_s * this.r_s;
    }

    /**
     * 주어진 점이 블랙홀의 사건의 지평선 내부에 있는지 확인
     * @param px x 좌표
     * @param py y 좌표  
     * @param pz z 좌표
     * @returns 사건의 지평선 내부에 있으면 true
     */
    intercept(px: number, py: number, pz: number): boolean {
        const dx = px - this.position.x;
        const dy = py - this.position.y;
        const dz = pz - this.position.z;
        const dist2 = dx * dx + dy * dy + dz * dz;
        return dist2 < this.r_s_2;
    }
}
export const SagA:BlackHole = new BlackHole(new THREE.Vector3(0.0, 0.0, 0.0), Physics.SAGITTARIUS_A_MASS);

/**
 * 천체 객체 데이터 구조체
 * 
 * 시뮬레이션에서 사용되는 각종 천체들의 데이터를 저장합니다.
 * - 위치와 반지름 (Vector4의 w 컴포넌트에 반지름 저장)
 * - 색상 정보
 * - 질량과 속도
 */
export class ObjectData {
  /** 위치(xyz)와 반지름(w) */
  public posRadius: THREE.Vector4;
  
  /** 색상(rgb)과 알파(a) */
  public color: THREE.Vector4;
  
  /** 천체의 질량 (kg) */
  public mass: number;
  
  /** 천체의 속도 (m/s) */
  public velocity: THREE.Vector3;

  /**
   * 천체 객체 생성자
   * @param posRadius 위치와 반지름 벡터
   * @param color 색상 벡터
   * @param mass 질량
   * @param velocity 초기 속도 (기본값: 0벡터)
   */
  constructor(
    posRadius: THREE.Vector4,
    color: THREE.Vector4,
    mass: number,
    velocity: THREE.Vector3 = new THREE.Vector3(0.0, 0.0, 0.0)
  ) {
    this.posRadius = posRadius;
    this.color = color;
    this.mass = mass;
    this.velocity = velocity;
  }
}

/** 시뮬레이션 객체들 배열 */
export const defaultObjects: ObjectData[] = [
  // 노란색 항성 (4×10^11m 거리)
  new ObjectData(
    new THREE.Vector4(4e11, 0.0, 0.0, 4e10),
    new THREE.Vector4(1, 1, 0, 1),
    1.98892e30  // 태양 질량
  ),
  
  // 빨간색 항성 (Z축 4×10^11m 거리)  
  new ObjectData(
    new THREE.Vector4(0.0, 0.0, 4e11, 4e10),
    new THREE.Vector4(1, 0, 0, 1),
    1.98892e30  // 태양 질량
  ),
  
  // 블랙홀 자체 (검은색, 사건의 지평선 크기)
  new ObjectData(
    new THREE.Vector4(0.0, 0.0, 0.0, SagA.r_s),
    new THREE.Vector4(0, 0, 0, 1),
    SagA.mass
  )
];