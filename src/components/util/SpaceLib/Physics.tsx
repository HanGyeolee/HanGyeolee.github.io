// =============== 물리 상수 ===============
export class Physics {
  /** 빛의 속도 (m/s) */
  static readonly c:number = 299792458.0;

  /** 빛의 속도 (m/s) */
  static readonly c_2:number = 299792458.0 * 299792458.0;
  
  /** 중력 상수 (m^3/(kg*s^2)) */
  static readonly G:number = 6.67430e-11;
  
  /** 파이 상수 */
  static readonly M_PI:number = 3.1415926535897932384626;
  
  /** 궁수자리 A* 블랙홀의 질량 (kg) */
  static readonly SAGITTARIUS_A_MASS = 8.54e36;
}