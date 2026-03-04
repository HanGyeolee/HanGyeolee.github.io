import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { SpiritKey, LiqueurCategory } from "../../components/util/HouseBar/houseType.tsx";
import {
  baseSpirits,
  liqueurBottles,
  hasUtil,
  UTIL_REQUIRED,
  isSpiritAvailable,
  isLiqueurCategoryAvailable,
  isMixerCategoryAvailable,
  isLiqueurSectionAvailable,
  isRecipeAvailable,
  getSpiritGuideFlavor,
  getLiqueurGuideMeta,
} from "../../components/util/HouseBar/houseBottle.tsx";
import {
  allSections,
  UnifiedRecipe,
  GuideType,
  Ingredient,
} from "../../components/util/HouseBar/guideData.tsx";

// ── 색상 토큰 ─────────────────────────────────────────────────────────────────
const C = {
  bg:         "#080b0f",
  panel:      "#0e1318",
  border:     "#1a2230",
  text:       "#c8d8e8",
  muted:      "#738796",
  build:      "#f0a030",
  buildDim:   "rgba(151,101,31,0.14)",
  shake:      "#38d98a",
  shakeDim:   "rgba(38,145,93,0.13)",
  layer:      "#b07ef8",
  layerDim:   "rgba(104,74,146,0.13)",
  stir:       "#5ab4d4",
  stirDim:    "rgba(42,120,160,0.14)",
  blend:      "#a0d8ef",
  blendDim:   "rgba(60,140,180,0.13)",
  muddle:     "#8bc34a",
  muddleDim:  "rgba(80,140,40,0.13)",
  warn:       "#ff5a5a",
  warnDim:    "rgba(141,51,51,0.14)",
  green:      "#38d98a",
  greenDim:   "rgba(38,145,93,0.13)",
  baseTag:    "#f0a030",
  baseBg:     "rgba(143,95,29,0.1)",
  liqueurTag: "#b07ef8",
  liqueurBg:  "rgba(104,74,146,0.1)",
  mixerTag:   "#38d98a",
  mixerBg:    "rgba(38,145,93,0.1)",
  sugarTag:   "#8198a8",
  sugarBg:    "rgba(43,56,65,0.1)",
  saltTag:    "#e0c8a0",
  saltBg:     "rgba(120,100,60,0.1)",
} as const;

// ── 도구 → guideType 매핑 (로컬 복제) ─────────────────────────────────────────
const TOOL_LABEL: Record<keyof typeof hasUtil, string> = {
  Shaker:  "쉐이커",
  Blender: "블렌더",
  Muddler: "머들러",
};

// ── 구매 추천 타입 ──────────────────────────────────────────────────────────────
type SuggestionKind = "spirit" | "liqueur" | "tool";

interface PurchaseSuggestion {
  id: string;
  displayName: string;
  kind: SuggestionKind;
  unlocks: string[]; // 해금되는 레시피 이름 목록
}

// ── 시뮬레이션: 이 아이템 하나를 추가했을 때 레시피가 가능한지 판정 ──────────────
function isRecipeUnlockedBy(
  r: UnifiedRecipe,
  extra: {
    spiritKey?: SpiritKey;
    liqueurCategory?: LiqueurCategory;
    toolKey?: keyof typeof hasUtil;
  },
): boolean {
  // 도구 체크
  if (r.guideType) {
    const needed = UTIL_REQUIRED[r.guideType];
    if (needed) {
      const ok = hasUtil[needed] || extra.toolKey === needed;
      if (!ok) return false;
    }
  }
  // 메인 스피릿
  if (r.spiritKey) {
    const ok = isSpiritAvailable(r.spiritKey) || extra.spiritKey === r.spiritKey;
    if (!ok) return false;
  }
  // 추가 필수 스피릿
  if (r.requiresSpiritKeys) {
    for (const k of r.requiresSpiritKeys) {
      if (!isSpiritAvailable(k) && extra.spiritKey !== k) return false;
    }
  }
  // 리큐르 카테고리
  if (r.requiresLiqueurCategories) {
    for (const cat of r.requiresLiqueurCategories) {
      if (!isLiqueurCategoryAvailable(cat) && extra.liqueurCategory !== cat) return false;
    }
  }
  // 믹서 카테고리 (믹서는 단독 시뮬 대상 제외 — 대부분 inStock)
  if (r.requiresMixerCategories) {
    for (const cat of r.requiresMixerCategories) {
      if (!isMixerCategoryAvailable(cat)) return false;
    }
  }
  return true;
}

// ── 구매 추천 계산 ──────────────────────────────────────────────────────────────
function computeSuggestions(): PurchaseSuggestion[] {
  const allRecipes = allSections.flatMap((s) => s.recipes);

  // 현재 만들 수 있는 레시피 집합
  const currentlyAvailable = new Set(
    allRecipes
      .filter((r) =>
        isRecipeAvailable({
          guideType: r.guideType,
          spiritKey: r.spiritKey,
          requiresSpiritKeys: r.requiresSpiritKeys,
          requiresLiqueurCategories: r.requiresLiqueurCategories,
          requiresMixerCategories: r.requiresMixerCategories,
        }),
      )
      .map((r) => r.name),
  );

  const results: PurchaseSuggestion[] = [];

  // ① 도구
  for (const [toolKey, has] of Object.entries(hasUtil) as [keyof typeof hasUtil, boolean][]) {
    if (has) continue;
    const unlocks = allRecipes
      .filter((r) => !currentlyAvailable.has(r.name) && isRecipeUnlockedBy(r, { toolKey }))
      .map((r) => r.name);
    if (unlocks.length > 0)
      results.push({ id: `tool_${toolKey}`, displayName: TOOL_LABEL[toolKey], kind: "tool", unlocks });
  }

  // ② 스피릿 (key 단위 — 이미 inStock:true 가 있는 key 는 건너뜀)
  const coveredSpiritKeys = new Set(baseSpirits.filter((b) => b.inStock).map((b) => b.key));
  const seenSpiritKeys = new Set<string>();
  for (const spirit of baseSpirits.filter((b) => !b.inStock)) {
    if (coveredSpiritKeys.has(spirit.key) || seenSpiritKeys.has(spirit.key)) continue;
    seenSpiritKeys.add(spirit.key);
    const unlocks = allRecipes
      .filter((r) => !currentlyAvailable.has(r.name) && isRecipeUnlockedBy(r, { spiritKey: spirit.key }))
      .map((r) => r.name);
    if (unlocks.length > 0)
      results.push({ id: `spirit_${spirit.key}`, displayName: spirit.displayName, kind: "spirit", unlocks });
  }

  // ③ 리큐르 카테고리 (카테고리 단위 — 이미 inStock:true 가 있으면 건너뜀)
  const coveredLiqueurCats = new Set(liqueurBottles.filter((b) => b.inStock).map((b) => b.category));
  const seenLiqueurCats = new Set<string>();
  for (const bottle of liqueurBottles.filter((b) => !b.inStock)) {
    if (coveredLiqueurCats.has(bottle.category) || seenLiqueurCats.has(bottle.category)) continue;
    seenLiqueurCats.add(bottle.category);
    const unlocks = allRecipes
      .filter((r) => !currentlyAvailable.has(r.name) && isRecipeUnlockedBy(r, { liqueurCategory: bottle.category }))
      .map((r) => r.name);
    if (unlocks.length > 0)
      results.push({ id: `liqueur_${bottle.category}`, displayName: bottle.displayName, kind: "liqueur", unlocks });
  }

  // 해금 수 내림차순
  return results.sort((a, b) => b.unlocks.length - a.unlocks.length);
}

// ── 레시피 필터링 (검색 포함) ──────────────────────────────────────────────────
interface FilteredSection {
  sectionKey: string;
  icon: string;
  menuTitle: string;
  meta: string;
  recipes: UnifiedRecipe[];
}

function getFilteredSections(query: string): FilteredSection[] {
  const q = query.trim().toLowerCase();
  return allSections
    .filter((section) => {
      if (section.sectionKey === "liqueur") return isLiqueurSectionAvailable();
      return isSpiritAvailable(section.sectionKey as SpiritKey);
    })
    .map((section) => {
      const meta =
        section.sectionKey === "liqueur"
          ? getLiqueurGuideMeta()
          : getSpiritGuideFlavor(section.sectionKey as SpiritKey);

      let recipes = section.recipes.filter((r) =>
        isRecipeAvailable({
          guideType: r.guideType,
          spiritKey: r.spiritKey,
          requiresSpiritKeys: r.requiresSpiritKeys,
          requiresLiqueurCategories: r.requiresLiqueurCategories,
          requiresMixerCategories: r.requiresMixerCategories,
        }),
      );
      if (q) {
        recipes = recipes.filter(
          (r) => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q),
        );
      }
      return { ...section, meta, recipes };
    })
    .filter((s) => s.recipes.length > 0);
}

// ── 조주법 메타 ────────────────────────────────────────────────────────────────
const METHOD_LABEL: Record<GuideType, string> = {
  build: "BUILD", shake: "SHAKE", layer: "LAYER",
  stir: "STIR", blend: "BLEND", muddle: "MUDDLE",
};
const methodColors = (type: GuideType) => {
  if (type === "shake")  return { dot: C.shake,  bg: C.shakeDim,  text: C.shake };
  if (type === "layer")  return { dot: C.layer,  bg: C.layerDim,  text: C.layer };
  if (type === "stir")   return { dot: C.stir,   bg: C.stirDim,   text: C.stir };
  if (type === "blend")  return { dot: C.blend,  bg: C.blendDim,  text: C.blend };
  if (type === "muddle") return { dot: C.muddle, bg: C.muddleDim, text: C.muddle };
  return                        { dot: C.build,  bg: C.buildDim,  text: C.build };
};

const KIND_META: Record<SuggestionKind, { label: string; color: string }> = {
  spirit:  { label: "SPIRIT",  color: C.build },
  liqueur: { label: "LIQUEUR", color: C.layer },
  tool:    { label: "TOOL",    color: C.stir  },
};

const footerRules = [
  "탄산수·샴페인은 항상 마지막 투입, 섞지 않기",
  "STIR: 믹싱 글라스 + 얼음, 바 스푼 30-40회 후 스트레이너",
  "LAYER: 스푼 뒤집어 잔 벽면에 천천히, 밀도 높은 순서",
  "BLEND: 크러시드 아이스 1컵 + 블렌더 고속 15-20초",
  "MUDDLE: 민트·과일 가볍게 으깨기 — 과하면 쓴맛",
  "MULTI-BASE: 여러 스피릿이 모두 필요한 레시피",
];


// 서브 컴포넌트
const IngTag: React.FC<{ ing: Ingredient }> = ({ ing }) => {
  const base: React.CSSProperties = {
    fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.67rem * 1.25)",
    padding: "3px 9px", borderRadius: "3px",
    letterSpacing: "0.04em", border: "1px solid", whiteSpace: "nowrap",
  };
  const styleMap: Record<Ingredient["type"], React.CSSProperties> = {
    base:    { color: C.baseTag,    background: C.baseBg,    borderColor: C.baseTag },
    liqueur: { color: C.liqueurTag, background: C.liqueurBg, borderColor: C.liqueurTag },
    mixer:   { color: C.mixerTag,   background: C.mixerBg,   borderColor: C.mixerTag },
    sugar:   { color: C.sugarTag,   background: C.sugarBg,   borderColor: "#2a3440" },
    salt:    { color: C.saltTag,    background: C.saltBg,    borderColor: C.saltTag },
  };
  return <span style={{ ...base, ...styleMap[ing.type] }}>{ing.label}</span>;
};

const GuideSteps: React.FC<{ recipe: UnifiedRecipe }> = ({ recipe }) => {
  const mc = methodColors(recipe.guideType);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
      <span style={{
        fontFamily: "'Noto Serif KR', sans-serif", fontSize: "0.58rem",
        letterSpacing: "0.12em", fontWeight: 500,
        color: mc.text, background: mc.bg, border: `1px solid ${mc.dot}40`,
        padding: "2px 7px", borderRadius: "3px",
        whiteSpace: "nowrap", marginTop: "1px", flexShrink: 0,
      }}>
        {METHOD_LABEL[recipe.guideType]}
      </span>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
        {recipe.steps.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && !s.warn && (
              <span style={{ color: C.muted, opacity: 0.7, margin: "0 1px", fontSize: "calc(0.65rem * 1.25)" }}>→</span>
            )}
            <span style={{
              fontFamily: "'Noto Serif KR', sans-serif",
              fontSize: "calc(0.67rem * 1.25)", letterSpacing: "0.03em",
              color: s.warn ? C.warn : C.text, fontWeight: s.warn ? 600 : 400,
              background: s.warn ? C.warnDim : "transparent",
              padding: s.warn ? "1px 6px" : undefined,
              borderRadius: s.warn ? "3px" : undefined,
              border: s.warn ? `1px solid ${C.warn}50` : undefined,
            }}>
              {s.text}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const RecipeRow: React.FC<{ recipe: UnifiedRecipe }> = ({ recipe }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.border}`, padding: "13px 16px",
        transition: "background 0.15s ease",
        background: hovered ? "rgba(240,160,48,0.04)" : "transparent",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <span style={{ fontSize: "calc(0.88rem * 1.25)", fontWeight: 500, color: "#dde8f2", letterSpacing: "0.02em" }}>
          {recipe.name}
          {recipe.nameTag && (
            <span style={{
              fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.58rem * 1.25)",
              color: C.warn, background: C.warnDim, border: `1px solid ${C.warn}40`,
              padding: "1px 6px", borderRadius: "3px",
              letterSpacing: "0.06em", marginLeft: "8px", verticalAlign: "middle",
            }}>
              {recipe.nameTag}
            </span>
          )}
        </span>
        <span style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.72rem * 1.25)", color: C.build, flexShrink: 0, fontWeight: 500 }}>
          {recipe.abv}
        </span>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "2px" }}>
        {recipe.ingredients.map((ing) => <IngTag key={ing.label} ing={ing} />)}
      </div>
      <GuideSteps recipe={recipe} />
      {recipe.noteSub && (
        <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.6rem * 1.25)", color: C.muted, marginTop: "6px", paddingLeft: "2px", letterSpacing: "0.04em" }}>
          {recipe.noteSub}
        </div>
      )}
    </div>
  );
};

const SectionCard: React.FC<{ section: FilteredSection; delay: number }> = ({ section, delay }) => (
  <div className="guide-section-card" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: "4px", overflow: "hidden", animationDelay: `${delay}s` }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "11px 16px", borderBottom: `1px solid ${C.border}`, background: "rgba(240,160,48,0.04)", gap: "12px" }}>
      <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.72rem * 1.25)", letterSpacing: "0.2em", color: C.build, fontWeight: 500, flexShrink: 0 }}>
        {section.menuTitle.toLocaleUpperCase()}
      </div>
      <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.56rem * 1.25)", color: C.muted, letterSpacing: "0.05em", textAlign: "right", lineHeight: 1.55, maxWidth: "70%", whiteSpace: "pre-line" }}>
        {section.meta}
      </div>
    </div>
    {section.recipes.map((r) => <div key={r.name}><RecipeRow recipe={r} /></div>)}
  </div>
);

const Legends: React.FC = () => (
  <div style={{ marginBottom: "28px", display: "flex", flexDirection: "column", gap: "10px" }}>
    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap" }}>
      {([
        [C.build,  "BUILD"],
        [C.shake,  "SHAKE"],
        [C.layer,  "LAYER"],
        [C.stir,   "STIR"],
        [C.blend,  "BLEND"],
        [C.muddle, "MUDDLE"],
        [C.warn,   "NO STIR"],
      ] as [string, string][]).map(([color, label]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.66rem * 1.125)", color, letterSpacing: "0.1em" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, flexShrink: 0 }} />
          {label}
        </div>
      ))}
    </div>
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {([
        [C.baseTag,    "베이스 스피릿"],
        [C.liqueurTag, "리큐르"],
        [C.mixerTag,   "음료·첨가제"],
        [C.sugarTag,   "설탕"],
        [C.saltTag,    "소금"],
      ] as [string, string][]).map(([color, label]) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.63rem * 1.125)", color, letterSpacing: "0.1em" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: color, flexShrink: 0 }} />
          {label}
        </div>
      ))}
    </div>
  </div>
);

// ── 구매 추천 카드 ─────────────────────────────────────────────────────────────
const SuggestionCard: React.FC<{ s: PurchaseSuggestion; rank: number }> = ({ s, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const km = KIND_META[s.kind];
  const isTop = rank === 0;
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${isTop ? C.green + "60" : C.border}`,
      borderRadius: "4px", overflow: "hidden",
    }}>
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "9px 12px", cursor: "pointer", gap: "8px",
          background: expanded ? "rgba(56,217,138,0.04)" : isTop ? "rgba(56,217,138,0.03)" : "transparent",
          transition: "background 0.15s",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            {isTop && (
              <span style={{ fontSize: "calc(0.6rem * 1.25)", color: C.green }}>★</span>
            )}
            <span style={{
              fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.52rem * 1.25)",
              letterSpacing: "0.14em", color: km.color,
              background: `${km.color}18`, border: `1px solid ${km.color}40`,
              padding: "1px 5px", borderRadius: "3px",
            }}>
              {km.label}
            </span>
          </div>
          <span style={{
            fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.71rem * 1.25)",
            color: C.text, letterSpacing: "0.03em",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {s.displayName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <span style={{
            fontFamily: "'Noto Serif KR', sans-serif", fontWeight: 700,
            fontSize: "0.88rem", color: C.green,
            background: C.greenDim, border: `1px solid ${C.green}50`,
            borderRadius: "3px", padding: "1px 8px", lineHeight: 1.6,
          }}>
            +{s.unlocks.length}
          </span>
          <span style={{ color: C.muted, fontSize: "calc(0.65rem * 1.25)", userSelect: "none" as const }}>
            {expanded ? "▲" : "▼"}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ borderTop: `1px solid ${C.border}` }}>
          {s.unlocks.map((name) => (
            <div key={name} style={{
              padding: "5px 12px",
              borderBottom: `1px solid ${C.border}22`,
              fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.67rem * 1.25)",
              color: C.muted, letterSpacing: "0.03em",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ color: C.green, fontSize: "calc(0.5rem * 1.25)" }}>▸</span>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── 구매 추천 사이드바 ──────────────────────────────────────────────────────────
const ShoppingSidebar: React.FC<{
  suggestions: PurchaseSuggestion[];
  onClose: () => void;
}> = ({ suggestions, onClose }) => (
  <aside
    className="guide-sidebar-wrap"
    style={{
      width: "272px", flexShrink: 0,
      borderLeft: `1px solid ${C.border}`,
      background: C.bg,
      display: "flex", flexDirection: "column",
      height: "100vh", position: "sticky", top: 0,
      overflowY: "auto",
    }}
  >
    {/* 헤더 */}
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 14px 10px",
      borderBottom: `1px solid ${C.border}`,
      position: "sticky", top: 0, background: C.bg, zIndex: 10,
    }}>
      <div>
        <div style={{  fontFamily: "'Noto Serif KR', sans-serif",
                    fontWeight: 500, fontSize: "calc(0.7rem * 1.25)", color: C.build, letterSpacing: "0.18em", }}>
          🛒 구매 추천
        </div>
        <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.6rem * 1.25)", color: C.muted, letterSpacing: "0.06em", marginTop: "2px" }}>
          구매 → 즉시 해금 레시피 수 순
        </div>
      </div>
      <button
        onClick={onClose}
        style={{
          background: "none", border: `1px solid ${C.border}`,
          color: C.muted, cursor: "pointer", borderRadius: "3px",
          padding: "3px 8px", fontFamily: "'Noto Serif KR', sans-serif",
          fontSize: "calc(0.68rem * 1.25)",
        }}
      >
        ✕
      </button>
    </div>

    {/* 설명 */}
    <div style={{
      padding: "8px 14px 10px",
      borderBottom: `1px solid ${C.border}`,
      fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.58rem * 1.25)",
      color: C.muted, lineHeight: 1.65, letterSpacing: "0.04em",
    }}>
      다른 재료는 모두 보유 중이고
      <span style={{ color: C.warn, fontFamily: 'inherit' }}> 이것만 없어서</span> 못 만드는
      레시피가 가장 많은 항목 순서입니다.
    </div>

    {/* 카드 목록 */}
    <div style={{ padding: "10px 10px 40px", display: "flex", flexDirection: "column", gap: "7px" }}>
      {suggestions.length === 0 ? (
        <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.64rem * 1.25)", color: C.muted, padding: "24px 0", textAlign: "center" }}>
          모든 재고 구비 완료 ✓
        </div>
      ) : (
        suggestions.map((s, i) => <SuggestionCard key={s.id} s={s} rank={i} />)
      )}
    </div>
  </aside>
);

// ── 검색바 ─────────────────────────────────────────────────────────────────────
const SearchBar: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onSubmit: (v: string) => void;
  resultCount: number;
  hasQuery: boolean;
}> = ({ value, onChange, onSubmit, resultCount, hasQuery }) => {
  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit(value);
    if (e.key === "Escape") onSubmit("");
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "10px" }}>
      <div style={{ position: "relative", flex: 1 }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="레시피 검색 … (Enter 로 적용, Esc 로 초기화)"
          style={{
            width: "100%", boxSizing: "border-box" as const,
            background: C.panel, border: `1px solid ${C.border}`,
            borderRadius: "3px", padding: "6px 10px 6px 28px",
            fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.72rem * 1.25)",
            color: C.text, letterSpacing: "0.04em", outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.build)}
          onBlur={(e)  => (e.currentTarget.style.borderColor = C.border)}
        />
        <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: C.muted, fontSize: "calc(0.75rem * 1.25)", pointerEvents: "none" as const }}>
          ⌕
        </span>
      </div>
      <button
        onClick={() => onSubmit(value)}
        style={{
          background: C.buildDim, border: `1px solid ${C.build}60`, color: C.build,
          cursor: "pointer", borderRadius: "3px", padding: "5px 12px",
          fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.68rem * 1.25)", letterSpacing: "0.1em",
          whiteSpace: "nowrap" as const,
        }}
      >
        검색
      </button>
      {hasQuery && (
        <button
          onClick={() => onSubmit("")}
          style={{
            background: "none", border: `1px solid ${C.border}`, color: C.muted,
            cursor: "pointer", borderRadius: "3px", padding: "5px 10px",
            fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.68rem * 1.25)",
          }}
        >
          ✕
        </button>
      )}
      {hasQuery && (
        <span style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.62rem * 1.25)", color: resultCount > 0 ? C.green : C.warn, whiteSpace: "nowrap" as const }}>
          {resultCount}건
        </span>
      )}
    </div>
  );
};

// 메인 컴포넌트
const HouseBarGuide: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") ?? "";
  const [inputValue, setInputValue]     = useState(queryParam);
  const [sidebarOpen, setSidebarOpen]   = useState(true);

  const filteredSections = useMemo(() => getFilteredSections(queryParam), [queryParam]);
  const totalResults     = filteredSections.reduce((s, sec) => s + sec.recipes.length, 0);
  const suggestions      = useMemo(() => computeSuggestions(), []);

  const handleSearch = (v: string) => {
    const next = v.trim();
    setInputValue(next);
    if (next) setSearchParams({ q: next });
    else      setSearchParams({});
  };

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Noto+Sans+KR:wght@400;500&family=Noto+Serif+KR:wght@600&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .guide-header       { animation: fadeIn 0.5s ease both; }
        .guide-section-card { animation: fadeUp 0.5s ease both; }
        .guide-sidebar      { animation: fadeIn 0.3s ease both; }
        input::placeholder  { color:#4a5a6a; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:#1a2230; border-radius:2px; }
        @media (max-width:820px) {
          .guide-layout { flex-direction:column !important; }
          .guide-sidebar-wrap { width:100% !important; height:auto !important; position:static !important; border-left:none !important; border-top:1px solid #1a2230; }
        }
      `}</style>

      {/* 최외각: flex row */}
      <div className="guide-layout" style={{
        display: "flex", alignItems: "flex-start",
        background: C.bg, color: C.text,
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 300, fontSize: "13px", lineHeight: 1.6,
        minHeight: "100vh",
      }}>

        {/* ── 메인 콘텐츠 ────────────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0, padding: "32px 20px 80px" }}>

          {/* 헤더 */}
          <header className="guide-header" style={{ marginBottom: "24px", borderBottom: `1px solid ${C.border}`, paddingBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "1.15rem", fontWeight: 500, letterSpacing: "0.15em", color: C.build }}>
                  주조 가이드
                </h1>
                <p style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.65rem * 1.125)", color: C.muted, letterSpacing: "0.2em", textTransform: "uppercase" as const, marginTop: "4px" }}>
                  Cocktail Recipe Reference
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "calc(0.65rem * 1.25)", color: C.muted, letterSpacing: "0.12em", fontWeight: 500, }}>
                  단위 <span style={{ color: C.build, fontFamily:"inherit" }}>cc</span>
                </span>
                {/* 구매 추천 토글 */}
                <button
                  onClick={() => setSidebarOpen((v) => !v)}
                  style={{
                    background: sidebarOpen ? C.buildDim : C.panel,
                    border: `1px solid ${sidebarOpen ? C.build + "80" : C.border}`,
                    color: sidebarOpen ? C.build : C.muted,
                    cursor: "pointer", borderRadius: "3px",
                    padding: "5px 12px", fontFamily: "'Noto Serif KR', sans-serif",
                    fontWeight: 500,
                    fontSize: "calc(0.68rem * 1.25)", letterSpacing: "0.1em",
                    display: "flex", alignItems: "center", gap: "6px",
                    transition: "all 0.2s",
                  }}
                >
                  🛒 구매 추천
                  {suggestions.length > 0 && (
                    <span style={{ background: C.greenDim, color: C.green, border: `1px solid ${C.green}50`, borderRadius: "10px", padding: "0 6px", fontSize: "calc(0.6rem * 1.25)", fontWeight: 700, }}>
                      {suggestions.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 검색바 */}
            <SearchBar
              value={inputValue}
              onChange={setInputValue}
              onSubmit={handleSearch}
              resultCount={totalResults}
              hasQuery={!!queryParam}
            />
          </header>

          {/* 범례 */}
          <Legends />

          {/* 검색 결과 안내 */}
          {queryParam && filteredSections.length === 0 && (
            <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "0.78rem", color: C.muted, padding: "48px 0", textAlign: "center" as const }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "10px" }}>⌕</div>
              <span style={{ color: C.warn }}>"{queryParam}"</span>
              <span> 에 해당하는 레시피가 없습니다</span>
            </div>
          )}
          {queryParam && filteredSections.length > 0 && (
            <div style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "0.64rem", color: C.muted, marginBottom: "14px", letterSpacing: "0.06em" }}>
              <span style={{ color: C.build }}>"{queryParam}"</span> 검색 결과 —&nbsp;
              <span style={{ color: C.green }}>{totalResults}</span>개 레시피
            </div>
          )}

          {/* 레시피 그리드 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {filteredSections.map((section, i) => (
              <SectionCard key={section.sectionKey} section={section} delay={0.04 + i * 0.04} />
            ))}
          </div>

          {/* 푸터 */}
          <footer style={{ marginTop: "40px", borderTop: `1px solid ${C.border}`, paddingTop: "16px", display: "flex", flexWrap: "wrap" as const, gap: "20px", justifyContent: "space-between" }}>
            {footerRules.map((rule) => (
              <div key={rule} style={{ fontFamily: "'Noto Serif KR', sans-serif", fontSize: "0.62rem", color: C.muted, letterSpacing: "0.08em", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: C.border, marginRight: "2px" }}>//</span>
                {rule}
              </div>
            ))}
          </footer>
        </div>

        {/* ── 구매 추천 사이드바 ───────────────────────────────────── */}
        {sidebarOpen && (
          <div className="guide-sidebar">
            <ShoppingSidebar suggestions={suggestions} onClose={() => setSidebarOpen(false)} />
          </div>
        )}
      </div>
    </>
  );
};

export default HouseBarGuide;