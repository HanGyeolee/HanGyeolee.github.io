// house_bottle.tsx 
// 집에 보유한 모든 재료를 관리하는 단일 데이터 소스입니다.
//
// ✏️  수정 방법: inStock 값만 true / false 로 바꾸면 됩니다.
//
// 설계 원칙 
//  · baseSpirits: 같은 key 를 가진 항목이 여러 개여도 하나만 inStock: true 면 가용
//    예) scotch → 라가불린 + 발베니 둘 다 key:"scotch" → 어느 하나만 있으면 스카치 섹션 표시
//
//  · liqueurBottles: category 기준으로 레시피 매칭
//    "깔루아 없어도 같은 coffee 카테고리면 OK"
//    예) category:"coffee" → 깔루아, 티아마리아 등 아무거나 하나 있으면 coffee 레시피 가용
//
//  · mixers: category 기준으로 레시피 매칭
//    "레몬 생과즙 없어도 폴렝기 농축이 있으면 lemon_juice 레시피 가용"
//    예) category:"lemon_juice" → fresh 와 polenghi 둘 중 하나만 있으면 충분

import { BaseSpirit, LiqueurBottle, LiqueurCategory, Mixer, MixerCategory, SpiritKey } from "./houseType";

const hasUtil = {
  /** 쉐이커 보유 여부 */
  Shaker: false,
  /** 블렌더 보유 여부 */
  Blender: false,
  /** 머들러 보유 여부 */
  Muddler: false,
}

// 조주 방법 → 필요 도구 매핑
// build / layer / stir 는 도구 불필요이므로 제외
const UTIL_REQUIRED: Partial<Record<string, keyof typeof hasUtil>> = {
  shake:  "Shaker",
  blend:  "Blender",
  muddle: "Muddler",
};

// 1 베이스 스피릿 
// 같은 key 를 가진 항목이 여러 개여도 하나만 inStock: true 면 해당 섹션 표시

export const baseSpirits: BaseSpirit[] = [
  // Vodka
  {
    id: "mr_boston_vodka",
    key: "vodka",
    displayName: "Mr.Boston 40°",
    guideFlavor: "무색무취에 가까운 중성적 풍미·깔끔하고 순수한 알코올 베이스",
    inStock: true,
  },

  // Rum
  {
    id: "bacardi_white",
    key: "rum",
    displayName: "Bacardi 40°",
    guideFlavor: "가볍고 달콤한 사탕수수 향·과일 향이 은은한 화이트 럼의 부드러운 풍미",
    inStock: true,
  },

  // Whisky (Japanese/Blended)
  {
    id: "suntory_toki",
    key: "whisky",
    displayName: "Suntory 40°",
    guideFlavor: "부드러운 우드·바닐라 향·가벼운 곡물 단맛과 은은한 훈연 여운",
    inStock: true,
  },
  {
    id: "hibiki_harmony",
    key: "whisky",
    displayName: "Hibiki 43°",
    guideFlavor: "섬세한 플로럴·꿀 향·다채로운 일본 오크 여운과 화과자 같은 달콤함",
    inStock: true,
  },

  // Scotch (Single Malt) 
  {
    id: "lagavulin_16",
    key: "scotch",
    displayName: "Lagavulin 48°",
    guideFlavor: "강렬한 피트 스모크와 해풍 향·아이오딘과 달콤한 몰트가 교차하는 아일라 싱글몰트",
    inStock: true,
  },
  {
    id: "balvenie_12",
    key: "scotch",
    displayName: "Balvenie 40°",
    guideFlavor: "달콤한 꿀·바닐라 향·부드러운 오크와 살구 노트가 어우러진 스페이사이드 싱글몰트",
    inStock: true,
  },
  {
    id: "jw_B_12",
    key: "scotch",
    displayName: "JW Black 40°",
    guideFlavor: "스모키함 없이 부드러운 블렌디드 스카치·꿀·바닐라·살짝 건과일 여운",
    inStock: true,
  },

  // Bourbon
  {
    id: "evan_williams",
    key: "bourbon",
    displayName: "Evan Williams 40°",
    guideFlavor: "옥수수 베이스의 달콤한 바닐라·캐러멜·오크 향·부드럽고 묵직한 미국 버번",
    inStock: true,
  },

  // Gin 
  {
    id: "gordons_gin",
    key: "gin",
    displayName: "Gordon's 37.5°",
    guideFlavor: "주니퍼베리 중심의 클래식 런던 드라이 진·깔끔하고 허브향이 균형 잡힌 풍미",
    inStock: false,
  },
  {
    id: "masaharu_gin",
    key: "gin",
    displayName: "Masaharu 47°",
    guideFlavor: "주니퍼베리 중심의 허브 보태니컬 향·시트러스와 플로럴 노트가 어우러진 복합 풍미",
    inStock: true,
  },

  // Cognac / Brandy 
  {
    id: "hennessy_vs",
    key: "cognac",
    displayName: "Hennessy VS 40°",
    guideFlavor: "말린 과일·오크 향·바닐라와 꽃향이 어우러진 부드럽고 우아한 꼬냑",
    inStock: true,
  },
  
  // ── Tequila (최저가: Jose Cuervo Especial Silver, 약 ₩25,000/750ml)
  {
    id: "cuervo_silver",
    key: "tequila",
    displayName: "Cuervo Silver 38°",
    guideFlavor: "아가베의 풋풋한 식물성 향·깔끔하고 약간 달콤한 화이트 데킬라",
    inStock: false,
  },

  // ── White Wine (최저가: Santa Rita 120, 약 ₩9,000/750ml)
  {
    id: "santa_rita_sauvignon",
    key: "white_wine",
    displayName: "Santa Rita 120 SB 12°",
    guideFlavor: "청사과·그린 허브 향·산뜻한 산미와 가벼운 미네랄 여운의 소비뇽 블랑",
    inStock: false,
  },

  // ── Champagne / Sparkling (최저가: Freixenet Cordon Negro Cava, 약 ₩12,000/750ml)
  {
    id: "freixenet_cava",
    key: "champagne",
    displayName: "Freixenet Cava 11.5°",
    guideFlavor: "섬세한 버블·신선한 사과·레몬 향·드라이하면서 깔끔한 스파클링 와인",
    inStock: false,
  },

  // ── Sloe Gin (최저가: Gordon's Sloe Gin, 약 ₩20,000/700ml)
  {
    id: "gordons_sloe_gin",
    key: "sloe_gin",
    displayName: "Gordon's Sloe 26°",
    guideFlavor: "야생 자두(슬로베리) 향·달콤하고 살짝 씁쓸한 베리 풍미",
    inStock: false,
  },

  // ── Apple Brandy (최저가: Laird's Applejack, 약 ₩35,000/750ml)
  {
    id: "lairds_applejack",
    key: "apple_brandy",
    displayName: "Laird's Applejack 40°",
    guideFlavor: "신선한 사과·바닐라 향·가볍고 부드러운 사과 브랜디 풍미",
    inStock: false,  // ← 현재 재고 없음
  },
];

// 2 리큐르 
// category 가 같은 항목 중 하나라도 inStock: true 면 해당 카테고리 가용

export const liqueurBottles: LiqueurBottle[] = [
  // coffee 
  {
    id: "kahlua",
    displayName: "Kahlúa 16°",
    category: "coffee",
    inStock: true,
  },

  // orange 
  {
    id: "triple_sec",
    displayName: "Triple Sec 40°",
    category: "orange",
    inStock: true,
  },
  // 오렌지
  // ── blue_curacao (최저가: Bols Blue, 약 ₩18,000/700ml)
  { 
    id: "bols_blue_curacao", 
    displayName: "Bols Blue 24°", 
    category: "blue_curacao", 
    inStock: false 
  },

  // chocolate_cream 
  {
    id: "baileys",
    displayName: "Baileys Irish 17°",
    category: "chocolate_cream",
    inStock: true,
  },
  {
    id: "mozart_chocolate",
    displayName: "Mozart Choco 17°",
    category: "chocolate_cream",
    inStock: true,
  },

  // ── creme_de_cacao (최저가: Bols, 약 ₩18,000/700ml)
  { 
    id: "bols_cacao_white", 
    displayName: "Bols Cacao White 24°", 
    category: "creme_de_cacao", 
    inStock: false 
  },
  { 
    id: "bols_cacao_brown", 
    displayName: "Bols Cacao Brown 24°", 
    category: "creme_de_cacao", 
    inStock: false 
  },

  // amaretto 
  {
    id: "disaronno",
    displayName: "Disaronno Amaretto 28°",
    category: "amaretto",
    inStock: false,  // ← 현재 재고 없음
  },

  // coconut 
  {
    id: "malibu",
    displayName: "Malibu 21°",
    category: "coconut",
    inStock: false,  // ← 현재 재고 없음
  },
  
  // ── drambuie (드람뷔 약 ₩45,000/700ml — Rusty Nail 전용)
  { 
    id: "drambuie", 
    displayName: "Drambuie 40°", 
    category: "drambuie", 
    inStock: false 
  },

  // ── sweet_vermouth (최저가: Martini Rosso, 약 ₩10,000/750ml)
  { 
    id: "martini_rosso", 
    displayName: "Martini Rosso 15°", 
    category: "sweet_vermouth", 
    inStock: false 
  },

  // ── dry_vermouth (최저가: Martini Extra Dry, 약 ₩10,000/750ml)
  { 
    id: "martini_extra_dry", 
    displayName: "Martini Extra Dry 18°", 
    category: "dry_vermouth", 
    inStock: false 
  },

  // ── campari (단일 브랜드, 약 ₩22,000/700ml)
  { 
    id: "campari", 
    displayName: "Campari 25°", 
    category: "campari", 
    inStock: false 
  },

  // 페퍼민트
  // ── creme_de_menthe (최저가: Bols, 약 ₩18,000/700ml)
  { 
    id: "bols_menthe_green", 
    displayName: "Bols Menthe Green 24°", 
    category: "creme_de_menthe", 
    inStock: false 
  },
  { 
    id: "bols_menthe_white", 
    displayName: "Bols Menthe White 24°", 
    category: "creme_de_menthe", 
    inStock: false 
  },

  // peach 복숭아
  // ── peach_schnapps (최저가: Bols / DeKuyper, 약 ₩18,000/700ml)
  { 
    id: "bols_peach", 
    displayName: "Bols Peach 17°", 
    category: "peach_schnapps", 
    inStock: false 
  },
  { 
    id: "peach_tree", 
    displayName: "Peach Tree 20°", 
    category: "peach_schnapps", 
    inStock: false 
  },

  // cassis 건포도
  // ── cassis (최저가: Bols Cassis, 약 ₩18,000/700ml)
  { 
    id: "bols_cassis", 
    displayName: "Bols Cassis 17°", 
    category: "cassis", 
    inStock: false 
  },

  // sweet hub, 단 허브
  // ── galliano (단일 브랜드, 약 ₩38,000/500ml)
  { 
    id: "galliano", 
    displayName: "Galliano 30°", 
    category: "galliano", 
    inStock: false 
  },

  // apricot 살구
  // ── apricot_brandy (최저가: Bols, 약 ₩18,000/700ml)
  { 
    id: "bols_apricot", 
    displayName: "Bols Apricot 24°", 
    category: "apricot_brandy", 
    inStock: false 
  },

  // cherry 체리
  // ── maraschino (Luxardo, 약 ₩28,000/500ml — Pousse Café 전용)
  { 
    id: "luxardo_maraschino", 
    displayName: "Luxardo Maraschino 32°", 
    category: "cherry", 
    inStock: false 
  },

  // ── cherry_brandy (최저가: Heering Cherry, 약 ₩28,000/700ml)
  { 
    id: "heering_cherry", 
    displayName: "Heering Cherry 24°", 
    category: "cherry", 
    inStock: false 
  },

  // ── benedictine (Bénédictine D.O.M., 약 ₩38,000/700ml — Honeymoon 전용)
  { 
    id: "benedictine_dom", 
    displayName: "Bénédictine D.O.M. 40°", 
    category: "benedictine", 
    inStock: false 
  },

  // ── apple_schnapps (최저가: Bols Apple, 약 ₩18,000/700ml — Apple Martini 전용)
  { 
    id: "bols_apple", 
    displayName: "Bols Apple 17°", 
    category: "apple_schnapps", 
    inStock: false 
  },
];

// 3 음료 · 첨가제
// category 가 같은 항목 중 하나라도 inStock: true 면 해당 카테고리 가용

export const mixers: Mixer[] = [
  // cola 
  {
    id: "cola",
    displayName: "콜라",
    category: "cola",
    inStock: true,
  },

  // tonic_water 
  {
    id: "tonic_water",
    displayName: "탄산수",
    category: "tonic_water",
    inStock: true,
  },

  // ── ginger_beer (Fever-Tree 진저비어, 약 ₩2,500/200ml)
  { 
    id: "fever_tree_ginger", 
    displayName: "진저비어", 
    category: "ginger_beer", 
    inStock: false 
  },

  // orange_juice 
  {
    id: "orange_juice_fresh",
    displayName: "오렌지 주스 (생과즙)",
    category: "orange_juice",
    inStock: true,
  },

  // lemon_juice
  {
    id: "lemon_juice_fresh",
    displayName: "레몬 주스 (생과즙)",
    category: "lemon_juice",
    inStock: false,
  },
  {
    id: "lemon_juice_polenghi",
    displayName: "레몬 주스 (Polenghi 농축)",
    category: "lemon_juice",
    inStock: true,
  },

  // lime_juice
  {
    id: "lime_juice_fresh",
    displayName: "라임 주스 (생과즙)",
    category: "lime_juice",
    inStock: false,
  },
  {
    id: "lime_juice_polenghi",
    displayName: "라임 주스 (Polenghi 농축)",
    category: "lime_juice",
    inStock: true,
  },
  
  // ── cranberry_juice (Ocean Spray, 약 ₩4,500/300ml)
  { 
    id: "ocean_spray_cranberry", 
    displayName: "크랜베리 주스", 
    category: "cranberry_juice", 
    inStock: false 
  },

  // ── pineapple_juice (Dole 캔, 약 ₩1,500/240ml)
  { 
    id: "dole_pineapple",
    displayName: "파인애플 주스", 
    category: "pineapple_juice",
    inStock: false 
  },

  // ── grapefruit_juice (신선도원 자몽, 약 ₩2,500/250ml)
  { 
    id: "grapefruit_juice", 
    displayName: "자몽 주스", 
    category: "grapefruit_juice", 
    inStock: false 
  },

  // ── tomato_juice (Kagome 토마토 주스, 약 ₩2,000/200ml)
  { 
    id: "kagome_tomato", 
    displayName: "토마토 주스", 
    category: "tomato_juice", 
    inStock: false 
  },

  // ── coconut_cream (Coco Lopez, 약 ₩4,000/400ml)
  { 
    id: "coco_lopez", 
    displayName: "코코넛 크림", 
    category: "coconut_cream", 
    inStock: false 
  },

  // ── cream (서울우유 생크림, 약 ₩3,500/200ml)
  { 
    id: "fresh_cream", 
    displayName: "생크림", 
    category: "cream", 
    inStock: false 
  },

  // ── grenadine (Monin 그레나딘, 약 ₩9,000/700ml)
  { 
    id: "monin_grenadine", 
    displayName: "그레나딘 시럽", 
    category: "grenadine", 
    inStock: false 
  },

  // ── orgeat (Monin 오르젯, 약 ₩9,000/700ml)
  { 
    id: "monin_orgeat", 
    displayName: "오르젯 시럽", 
    category: "orgeat", 
    inStock: false 
  },

  // ── raspberry_syrup (Monin 라즈베리, 약 ₩9,000/700ml)
  { 
    id: "monin_raspberry", 
    displayName: "라즈베리 시럽", 
    category: "raspberry_syrup", 
    inStock: false 
  },

  // ── peach_puree (Monin 피치 퓨레, 약 ₩9,000/700ml)
  { 
    id: "monin_peach_puree", 
    displayName: "피치 퓨레", 
    category: "peach_puree", 
    inStock: false 
  },

  // ── red_wine (최저가: Casillero del Diablo, 약 ₩9,000/750ml — 뉴욕 사워 플로트용)
  { 
    id: "red_wine_float", 
    displayName: "레드 와인 (플로트용)", 
    category: "red_wine", 
    inStock: false 
  },

  // ── mint (생 민트, 마트 약 ₩2,000)
  { 
    id: "fresh_mint", 
    displayName: "생 민트잎", 
    category: "mint", 
    inStock: false 
  },

  // ── bitters (Angostura Bitters, 약 ₩12,000/200ml)
  { 
    id: "angostura_bitters", 
    displayName: "Angostura Bitters", 
    category: "bitters", 
    inStock: false 
  },

  // ── egg_white (달걀 흰자)
  { 
    id: "egg_white", 
    displayName: "달걀 흰자", 
    category: "egg_white", 
    inStock: true 
  },

  // sugar 
  {
    id: "sugar",
    displayName: "설탕",
    category: "sugar",
    inStock: true,
  },

  // salt 
  {
    id: "salt",
    displayName: "소금",
    category: "salt",
    inStock: true,
  },
];

// 헬퍼 함수 

/**
 * 해당 key 의 스피릿이 하나라도 inStock: true 면 true.
 * 같은 key 를 가진 항목이 여러 개여도 정상 동작합니다.
 */
export function isSpiritAvailable(key: SpiritKey): boolean {
  return baseSpirits.some((b) => b.key === key && b.inStock);
}

/**
 * 해당 카테고리의 리큐르가 하나라도 inStock: true 면 true.
 * 브랜드와 무관하게 같은 맛/향 카테고리면 호환으로 간주합니다.
 */
export function isLiqueurCategoryAvailable(cat: LiqueurCategory): boolean {
  return liqueurBottles.some((b) => b.category === cat && b.inStock);
}

/**
 * 해당 카테고리의 음료가 하나라도 inStock: true 면 true.
 * 예) lemon_juice_fresh 가 없어도 lemon_juice_polenghi 가 있으면 true.
 */
export function isMixerCategoryAvailable(cat: MixerCategory): boolean {
  return mixers.some((m) => m.category === cat && m.inStock);
}

/**
 * 레시피 하나가 지금 당장 만들 수 있는지 종합 판정.
 * 베이스 스피릿 · 리큐르 카테고리 · 음료 카테고리 세 가지 모두 충족해야 true.
 */
export function isRecipeAvailable(opts: {
  guideType?: string;                    // 조주 방법 — 도구 가용 여부 체크용
  spiritKey?: SpiritKey;
  requiresSpiritKeys?: SpiritKey[];
  requiresLiqueurCategories?: LiqueurCategory[];
  requiresMixerCategories?: MixerCategory[];
}): boolean {
  // 도구 체크: shake → Shaker, blend → Blender, muddle → Muddler
  if (opts.guideType) {
    const utilKey = UTIL_REQUIRED[opts.guideType];
    if (utilKey && !hasUtil[utilKey]) return false;
  }
  if (opts.spiritKey && !isSpiritAvailable(opts.spiritKey)) return false;
  if (opts.requiresSpiritKeys?.some((key) => !isSpiritAvailable(key))) return false;
  if (opts.requiresLiqueurCategories?.some((cat) => !isLiqueurCategoryAvailable(cat))) return false;
  if (opts.requiresMixerCategories?.some((cat) => !isMixerCategoryAvailable(cat))) return false;
  return true;
}

/**
 * 리큐르 섹션 가용 여부: 하나라도 inStock 리큐르가 있으면 섹션 표시.
 * (개별 레시피 가용 여부는 isRecipeAvailable 로 필터링)
 */
export function isLiqueurSectionAvailable(): boolean {
  return liqueurBottles.some((b) => b.inStock);
}

/**
 * 메뉴 섹션 라벨: inStock 인 병 이름을 나열.
 * 예) scotch → "Lagavulin 48° · Balvenie 12°"
 */
export function getSpiritMenuBase(key: SpiritKey): string {
  const names = baseSpirits
    .filter((b) => b.key === key && b.inStock)
    .map((b) => b.displayName);
  return names.join("\n") || key;
}

/**
 * 가이드 섹션 풍미 설명: inStock 인 병 설명을 나열.
 * 병이 여러 개면 " / " 로 구분.
 */
export function getSpiritGuideFlavor(key: SpiritKey): string {
  const flavors = baseSpirits
    .filter((b) => b.key === key && b.inStock)
    .map((b) => b.displayName+":"+b.guideFlavor);
  return flavors.join("\n") || "";
}

/**
 * 가이드 리큐르 섹션 meta: inStock 인 리큐르 이름 나열.
 */
export function getLiqueurGuideMeta(): string {
  return (
    liqueurBottles
      .filter((b) => b.inStock)
      .map((b) => b.displayName)
      .join("\n") || "리큐르"
  );
}