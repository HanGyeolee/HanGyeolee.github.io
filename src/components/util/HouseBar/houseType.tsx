
// ── 타입 ─────────────────────────────────────────────────────────

/** 베이스 스피릿 종류 키 */
export type SpiritKey =
  | "vodka"
  | "rum"
  | "blended"       // 일본/블렌디드 위스키
  | "scotch"       // 스카치 싱글몰트
  | "bourbon"      // 버번/라이 위스키
  | "gin"
  | "cognac"       // 꼬냑/브랜디
  | "tequila"      // 데킬라
  | "white_wine"   // 화이트 와인
  | "champagne"    // 샴페인/스파클링
  | "apple_brandy" // 사과 브랜디 / 칼바도스 / 애플잭 (Honeymoon)
  | "sloe_gin"     // 슬로 진

/**
 * 리큐르 맛/향 카테고리 (브랜드 무관)
 * 레시피는 이 카테고리를 요구합니다.
 */
export type LiqueurCategory =
  | "coffee"           // 깔루아, 티아마리아 등
  | "orange"           // 트리플섹, 쿠앵트로, 그랑 마르니에 등
  | "chocolate_cream"  // 베일리스, 모차르트 초콜릿 크림 등
  | "amaretto"         // 아마레또, 디사론노 등
  | "coconut"          // 말리부 등
  | "drambuie"         // 드람뷔 (Rusty Nail)
  | "sweet_vermouth"   // 마르티니 로쏘, 카르파노 등 (Rob Roy, Manhattan, Negroni)
  | "dry_vermouth"     // 마르티니 엑스트라 드라이 등 (Martini, Gibson)
  | "campari"          // 캄파리 (Negroni, Americano)
  | "cherry"           // 히어링 체리 브랜디 (Singapore Sling), 룩사르도 마라스키노 (Pousse Café)
  | "blue_curacao"     // 볼스 블루 퀴라소 (Blue Hawaiian)
  | "creme_de_cacao"   // 볼스 크렘 드 카카오 (Brandy Alexander, Grasshopper)
  | "creme_de_menthe"  // 볼스 크렘 드 민트 (Stinger, Grasshopper)
  | "peach_schnapps"   // 볼스 피치 슈납스 (Sex on the Beach)
  | "apple_schnapps"   // 볼스 애플 슈납스 (Appletini)
  | "cassis"           // 볼스 카시스 (Kir, Kir Royale)
  | "galliano"         // 갈리아노 (Harvey Wallbanger)
  | "apricot_brandy"   // 볼스 애프리콧 브랜디 (Paradise)
  | "benedictine"      // 베네딕틴 (B&B)
  | "melon_liqueur"    // 미도리 등 멜론 리큐르 (June Bug)
  | "banana_liqueur"   // 크렘 드 바나나 등 (June Bug)

/**
 * 음료·첨가제 카테고리 (상품 무관)
 * 레시피는 이 카테고리를 요구합니다.
 * 같은 카테고리에 여러 항목 중 하나만 inStock: true 면 가용.
 */
export type MixerCategory =
  | "cola"
  | "tonic_water"      // 진 토닉용
  | "ginger_beer"      // 모스코 뮬, 진 벅용
  | "orange_juice"
  | "lemon_juice"
  | "lime_juice"
  | "cranberry_juice"  // 코스모폴리탄, 씨 브리즈
  | "pineapple_juice"  // 피나 콜라다, 블루 하와이안
  | "grapefruit_juice" // 솔티 독, 씨 브리즈
  | "tomato_juice"     // 블러디 메리
  | "coconut_cream"    // 피나 콜라다, 블루 하와이안
  | "cream"            // 화이트 러시안, 브랜디 알렉산더
  | "milk"             // 그래스 호퍼
  | "grenadine"        // 바카디, 데킬라 선라이즈, 싱가포르 슬링
  | "orgeat"           // 마이 타이
  | "raspberry_syrup"  // 클로버 클럽
  | "peach_puree"      // 벨리니
  | "red_wine"         // 
  | "mint"             // 모히토
  | "bitters"          // 올드 패션드, 맨해튼, 롭 로이
  | "egg_white"        // 핑크 레이디, 클로버 클럽
  | "sugar"
  | "salt"

export interface BaseSpirit {
  /** 고유 식별자 (브랜드명 슬러그) */
  id: string;
  /** 스피릿 종류 키 — 같은 key 다수 허용 */
  key: SpiritKey;
  /** 메뉴 섹션 라벨 (예: "Balvenie 12°") */
  displayName: string;
  /** 가이드 섹션 풍미·향 설명 */
  guideFlavor: string;
  inStock: boolean;
}

export interface LiqueurBottle {
  /** 고유 식별자 */
  id: string;
  /** 표시명 */
  displayName: string;
  /** 레시피 매칭에 사용되는 맛/향 카테고리 */
  category: LiqueurCategory;
  inStock: boolean;
}

export interface Mixer {
  /** 고유 식별자 */
  id: string;
  /** 표시명 */
  displayName: string;
  /** 레시피 매칭에 사용되는 카테고리 */
  category: MixerCategory;
  inStock: boolean;
}
