import React from "react";

import {
  SpiritKey
} from "../../components/util/HouseBar/houseType.tsx";
import {
  isSpiritAvailable,
  isLiqueurSectionAvailable,
  isRecipeAvailable,
  getSpiritGuideFlavor,
  getLiqueurGuideMeta
} from "../../components/util/HouseBar/houseBottle.tsx";
import { allSections, UnifiedRecipe, GuideType, Ingredient } from "../../components/util/HouseBar/guideData.tsx";

// 색상 토큰
const C = {
  bg: "#080b0f",
  panel: "#0e1318",
  border: "#1a2230",
  text: "#c8d8e8",
  muted: "#738796",
  build: "#f0a030",
  buildDim: "rgba(151, 101, 31, 0.14)",
  shake: "#38d98a",
  shakeDim: "rgba(38, 145, 93, 0.13)",
  layer: "#b07ef8",
  layerDim: "rgba(104, 74, 146, 0.13)",
  stir: "#5ab4d4",
  stirDim: "rgba(42, 120, 160, 0.14)",
  blend: "#a0d8ef",
  blendDim: "rgba(60, 140, 180, 0.13)",
  muddle: "#8bc34a",
  muddleDim: "rgba(80, 140, 40, 0.13)",
  warn: "#ff5a5a",
  warnDim: "rgba(141, 51, 51, 0.14)",
  // 재료 태그 색상
  baseTag: "#f0a030",
  baseBg: "rgba(143, 95, 29, 0.1)",
  liqueurTag: "#b07ef8",
  liqueurBg: "rgba(104, 74, 146, 0.1)",
  mixerTag: "#38d98a",
  mixerBg: "rgba(38, 145, 93, 0.1)",
  sugarTag: "#8198a8",
  sugarBg: "rgba(43, 56, 65, 0.1)",
  saltTag: "#e0c8a0",
  saltBg: "rgba(120, 100, 60, 0.1)",
} as const;

// 필터링 
interface FilteredSection {
  sectionKey: string;
  icon: string;
  menuTitle: string;
  meta: string;
  recipes: UnifiedRecipe[];
}

function getFilteredSections(): FilteredSection[] {
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

      const recipes = section.recipes.filter((r) =>
        isRecipeAvailable({
          guideType: r.guideType,
          spiritKey: r.spiritKey,
          requiresSpiritKeys: r.requiresSpiritKeys,
          requiresLiqueurCategories: r.requiresLiqueurCategories,
          requiresMixerCategories: r.requiresMixerCategories,
        })
      );

      return { ...section, meta, recipes };
    })
    .filter((s) => s.recipes.length > 0);
}

//  헬퍼 
const METHOD_LABEL: Record<GuideType, string> = {
  build:  "BUILD",
  shake:  "SHAKE",
  layer:  "LAYER",
  stir:   "STIR",
  blend:  "BLEND",
  muddle: "MUDDLE",
};

const methodColors = (type: GuideType) => {
  if (type === "shake")  return { dot: C.shake,  bg: C.shakeDim,  text: C.shake };
  if (type === "layer")  return { dot: C.layer,  bg: C.layerDim,  text: C.layer };
  if (type === "stir")   return { dot: C.stir,   bg: C.stirDim,   text: C.stir };
  if (type === "blend")  return { dot: C.blend,  bg: C.blendDim,  text: C.blend };
  if (type === "muddle") return { dot: C.muddle, bg: C.muddleDim, text: C.muddle };
  return                        { dot: C.build,  bg: C.buildDim,  text: C.build };
};

const footerRules = [
  "탄산수·샴페인은 항상 마지막 투입, 섞지 않기",
  "설탕 1tsp ≈ 5g · 생과즙 없으면 Polenghi 농축 사용 가능",
];

//  재료 태그 
const IngTag: React.FC<{ ing: Ingredient }> = ({ ing }) => {
  const base: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "calc(0.67rem * 1.25)",
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

//  조주 스텝 
const GuideSteps: React.FC<{ recipe: UnifiedRecipe }> = ({ recipe }) => {
  const mc = methodColors(recipe.guideType);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
      <span style={{
        fontFamily: "'DM Mono', monospace", fontSize: "0.58rem",
        letterSpacing: "0.12em", fontWeight: 500,
        color: mc.text, background: mc.bg,
        border: `1px solid ${mc.dot}40`,
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
              fontFamily: "'DM Mono', monospace",
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

//  레시피 행
const RecipeRow: React.FC<{ recipe: UnifiedRecipe }> = ({ recipe }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      style={{
        borderBottom: `1px solid ${C.border}`,
        padding: "13px 16px",
        transition: "background 0.15s ease",
        background: hovered ? "rgba(240,160,48,0.04)" : "transparent",
        cursor: "default",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: "flex", alignItems: "baseline",
        justifyContent: "space-between", marginBottom: "8px", gap: "8px",
      }}>
        <span style={{ fontSize: "calc(0.88rem * 1.25)", fontWeight: 500, color: "#dde8f2", letterSpacing: "0.02em" }}>
          {recipe.name}
          {recipe.nameTag && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.58rem * 1.25)",
              color: C.warn, background: C.warnDim,
              border: `1px solid ${C.warn}40`,
              padding: "1px 6px", borderRadius: "3px",
              letterSpacing: "0.06em", marginLeft: "8px", verticalAlign: "middle",
            }}>
              {recipe.nameTag}
            </span>
          )}
        </span>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: "calc(0.72rem * 1.25)",
          color: C.build, flexShrink: 0, fontWeight: 500,
        }}>
          {recipe.abv}
        </span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "2px" }}>
        {recipe.ingredients.map((ing) => (
          <IngTag key={ing.label} ing={ing} />
        ))}
      </div>

      <GuideSteps recipe={recipe} />

      {recipe.noteSub && (
        <div style={{
          fontFamily: "'DM Mono', monospace", fontSize: "0.6rem",
          color: C.muted, marginTop: "6px",
          paddingLeft: "2px", letterSpacing: "0.04em",
        }}>
          {recipe.noteSub}
        </div>
      )}
    </div>
  );
};

//  섹션 카드
const SectionCard: React.FC<{ section: FilteredSection; delay: number }> = ({ section, delay }) => (
  <div
    className="guide-section-card"
    style={{
      background: C.panel, border: `1px solid ${C.border}`,
      borderRadius: "4px", overflow: "hidden",
      animationDelay: `${delay}s`,
    }}
  >
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      padding: "11px 16px", borderBottom: `1px solid ${C.border}`,
      background: "rgba(240,160,48,0.04)", gap: "12px",
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "calc(0.72rem * 1.25)", letterSpacing: "0.2em",
        color: C.build, fontWeight: 500, flexShrink: 0,
      }}>
        {section.menuTitle.toLocaleUpperCase()}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "calc(0.56rem * 1.25)", color: C.muted,
        letterSpacing: "0.05em", textAlign: "right",
        lineHeight: 1.55, maxWidth: "70%", whiteSpace: "pre-line",
      }}>
        {section.meta}
      </div>
    </div>

    {section.recipes.map((recipe) => (
      <div key={recipe.name}>
        <RecipeRow recipe={recipe} />
      </div>
    ))}
  </div>
);

// 범례 
const Legends: React.FC = () => (
  <div style={{ maxWidth: "1100px", margin: "0 auto 28px", display: "flex", flexDirection: "column", gap: "10px" }}>
    {/* 조주 방식 */}
    <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
      {[
        { color: C.build,  label: "BUILD — 잔에 순서대로" },
        { color: C.shake,  label: "SHAKE — 강하게 흔들기 15–20초" },
        { color: C.layer,  label: "LAYER — 스푼 뒤집어 천천히" },
        { color: C.stir,   label: "STIR — 믹싱 글라스 + 스푼 30–40회" },
        { color: C.blend,  label: "BLEND — 블렌더 고속 (프로즌)" },
        { color: C.muddle, label: "MUDDLE — 머들러 → 빌드" },
        { color: C.warn,   label: "NO STIR — 탄산·레이어 보호" },
      ].map((item) => (
        <div key={item.label} style={{
          display: "flex", alignItems: "center", gap: "7px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "calc(0.66rem * 1.125)", color: item.color, letterSpacing: "0.1em",
        }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
          {item.label}
        </div>
      ))}
    </div>
    {/* 재료 태그 */}
    <div style={{ display: "flex", marginTop: "16px" , gap: "16px", flexWrap: "wrap" }}>
      {[
        { color: C.baseTag,    label: "베이스 스피릿" },
        { color: C.liqueurTag, label: "리큐르" },
        { color: C.mixerTag,   label: "음료·첨가제" },
        { color: C.sugarTag,   label: "설탕" },
        { color: C.saltTag,    label: "소금" },
      ].map((item) => (
        <div key={item.label} style={{
          display: "flex", alignItems: "center", gap: "6px",
          fontFamily: "'DM Mono', monospace",
          fontSize: "calc(0.63rem * 1.125)", color: item.color, letterSpacing: "0.1em",
        }}>
          <span style={{
            display: "inline-block", width: "8px", height: "8px",
            borderRadius: "2px", background: item.color, flexShrink: 0,
          }} />
          {item.label}
        </div>
      ))}
    </div>
  </div>
);

//  메인 컴포넌트
const HouseBarGuide: React.FC = () => {
  const filteredSections = getFilteredSections();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Noto+Sans+KR:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp  { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .guide-header       { animation: fadeIn 0.5s ease both; }
        .guide-legends      { animation: fadeIn 0.5s 0.1s ease both; }
        .guide-section-card { animation: fadeUp 0.5s ease both; }
        .guide-footer       { animation: fadeIn 0.5s 0.4s ease both; }
        @media (max-width: 600px) {
          .guide-grid   { grid-template-columns: 1fr !important; }
          .guide-header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
          .guide-header-right { text-align: left !important; }
        }
      `}</style>

      <div style={{
        background: C.bg, color: C.text,
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 300, fontSize: "13px", lineHeight: 1.6,
        minHeight: "100vh", padding: "32px 20px 80px",
      }}>

        <header className="guide-header" style={{
          maxWidth: "1100px", margin: "0 auto 36px",
          display: "flex", alignItems: "flex-end", justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`, paddingBottom: "16px",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'DM Mono', monospace", fontSize: "1.15rem",
              fontWeight: 500, letterSpacing: "0.15em", color: C.build,
            }}>
              주조 가이드
            </h1>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.65rem * 1.125)", color: C.muted,
              letterSpacing: "0.2em", textTransform: "uppercase", marginTop: "4px",
            }}>
              Cocktail Recipe Reference · 조주기능사 기출
            </p>
          </div>
          <div className="guide-header-right" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "calc(0.65rem * 1.125)", color: C.muted,
            letterSpacing: "0.12em", textAlign: "right", lineHeight: 1.8,
          }}>
            단위 <span style={{ color: C.build }}>cc</span>
            &nbsp;|&nbsp; 최대 단일 재료 <span style={{ color: C.build }}>60cc</span>
          </div>
        </header>

        <div className="guide-legends">
          <Legends />
        </div>

        <div className="guide-grid" style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: "16px",
        }}>
          {filteredSections.map((section, i) => (
            <SectionCard key={section.sectionKey} section={section} delay={0.05 + i * 0.05} />
          ))}
        </div>

        <footer className="guide-footer" style={{
          maxWidth: "1100px", margin: "40px auto 0",
          borderTop: `1px solid ${C.border}`, paddingTop: "16px",
          display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "space-between",
        }}>
          {footerRules.map((rule) => (
            <div key={rule} style={{
              fontFamily: "'DM Mono', monospace", fontSize: "0.62rem",
              color: C.muted, letterSpacing: "0.08em",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <span style={{ color: C.border, marginRight: "2px" }}>//</span>
              {rule}
            </div>
          ))}
        </footer>
      </div>
    </>
  );
};

export default HouseBarGuide;