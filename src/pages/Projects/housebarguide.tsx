import React from "react";

// ── 공유 타입 (HouseBarMenu.tsx 와 호환) ─────────────────────────────────────

type GuideType = "build" | "stir" | "layer";

interface Ingredient {
  label: string;
  type: "base" | "normal" | "sugar";
}

interface Step {
  text: string;
  warn?: boolean;
}

interface Recipe {
  name: string;
  nameTag?: string;
  abv: string;
  ingredients: Ingredient[];
  guideType: GuideType;
  steps: Step[];
  noteSub?: string;
}

interface GuideSection {
  icon: string;
  label: string;
  meta: string;
  recipes: Recipe[];
}

// ── 색상 토큰 ────────────────────────────────────────────────────────────────
// 기존 메뉴(어두운 금빛 테마)와 달리, 호스트 가이드는 높은 가독성 우선
// 밝은 네온 강조색 + 어두운 배경으로 "작업용 문서" 느낌

const C = {
  bg: "#080b0f",
  panel: "#0e1318",
  border: "#1a2230",
  text: "#c8d8e8",
  muted: "#738796",

  // 메서드 색상 — 선명하고 즉시 구별 가능
  build: "#f0a030",       // 밝은 주황-황금
  buildDim: "rgba(151, 101, 31, 0.14)",
  stir: "#38d98a",        // 밝은 민트-그린
  stirDim: "rgba(38, 145, 93, 0.13)",
  layer: "#b07ef8",       // 밝은 라벤더-퍼플
  layerDim: "rgba(104, 74, 146, 0.13)",
  warn: "#ff5a5a",        // 선명한 레드
  warnDim: "rgba(141, 51, 51, 0.14)",

  // 재료 태그
  baseTag: "#f0a030",
  baseBg: "rgba(143, 95, 29, 0.1)",
  sugarTag: "#8198a8",
  sugarBg: "rgba(43, 56, 65, 0.1)",
} as const;

// ── 데이터 ───────────────────────────────────────────────────────────────────

const guideData: GuideSection[] = [
  {
    icon: "🍶", label: "VODKA BASE", meta: "Mr. Boston · 40°",
    recipes: [
      {
        name: "스크류드라이버", abv: "17°",
        ingredients: [
          { label: "보드카 30", type: "base" },
          { label: "오렌지 주스 40", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "보드카" }, { text: "오렌지 주스" }, { text: "가볍게 스터" }],
      },
      {
        name: "블랙 러시안", abv: "32°",
        ingredients: [
          { label: "보드카 40", type: "base" },
          { label: "깔루아 20", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "보드카" }, { text: "깔루아" }, { text: "가볍게 스터" }],
      },
      {
        name: "초콜릿 러시안", abv: "28°",
        ingredients: [
          { label: "보드카 30", type: "base" },
          { label: "깔루아 15", type: "normal" },
          { label: "초콜릿 리큐르 15", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "깔루아" }, { text: "초콜릿 리큐르" }, { text: "보드카" }, { text: "가볍게 스터" }],
      },
      {
        name: "보드카 사워", abv: "27°",
        ingredients: [
          { label: "보드카 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "레몬" }, { text: "보드카" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "보드카 콜린스", abv: "16°",
        ingredients: [
          { label: "보드카 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 보드카" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "보드카 피즈", abv: "14°",
        ingredients: [
          { label: "보드카 30", type: "base" },
          { label: "레몬 15", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 보드카" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
    ],
  },
  {
    icon: "🍹", label: "RUM BASE", meta: "Bacardi · 40°",
    recipes: [
      {
        name: "쿠바 리브레", abv: "15°",
        ingredients: [
          { label: "럼 30", type: "base" },
          { label: "사이다 40", type: "normal" },
          { label: "라임 10", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "럼" }, { text: "사이다 붓기" }, { text: "라임 마무리" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "다이키리", abv: "27°",
        ingredients: [
          { label: "럼 40", type: "base" },
          { label: "라임 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "라임" }, { text: "럼" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "럼 사워", abv: "27°",
        ingredients: [
          { label: "럼 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "레몬" }, { text: "럼" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "럼 콜린스", abv: "16°",
        ingredients: [
          { label: "럼 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 럼" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "럼 피즈", abv: "14°",
        ingredients: [
          { label: "럼 30", type: "base" },
          { label: "레몬 15", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 럼" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
    ],
  },
  {
    icon: "🥃", label: "WHISKY BASE", meta: "Suntory · 40°",
    recipes: [
      {
        name: "하이볼", abv: "17°",
        ingredients: [
          { label: "산토리 30", type: "base" },
          { label: "사이다 40", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "위스키" }, { text: "사이다 천천히 붓기" }, { text: "🚫 절대 섞지 않음", warn: true }],
      },
      {
        name: "위스키 사워", abv: "27°",
        ingredients: [
          { label: "산토리 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "레몬" }, { text: "위스키" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "존 콜린스", abv: "16°",
        ingredients: [
          { label: "산토리 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 위스키" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "위스키 오렌지", abv: "17°",
        ingredients: [
          { label: "산토리 30", type: "base" },
          { label: "오렌지 주스 40", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "위스키" }, { text: "오렌지 주스" }, { text: "가볍게 스터" }],
      },
    ],
  },
  {
    icon: "🌿", label: "GIN BASE", meta: "Masaharu · 47°",
    recipes: [
      {
        name: "짐렛", abv: "31°",
        ingredients: [
          { label: "진 40", type: "base" },
          { label: "라임 20", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "진" }, { text: "라임" }, { text: "가볍게 스터" }],
      },
      {
        name: "진 사워", abv: "31°",
        ingredients: [
          { label: "진 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "레몬" }, { text: "진" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "톰 콜린스", abv: "19°",
        ingredients: [
          { label: "진 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 진" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "진 피즈", abv: "16°",
        ingredients: [
          { label: "진 30", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "사이다 40", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "build",
        steps: [{ text: "설탕 → 레몬 → 진" }, { text: "사이다 붓기" }, { text: "🚫 섞지 않음", warn: true }],
      },
      {
        name: "진 오렌지", abv: "20°",
        ingredients: [
          { label: "진 30", type: "base" },
          { label: "오렌지 주스 40", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "진" }, { text: "오렌지 주스" }, { text: "가볍게 스터" }],
      },
    ],
  },
  {
    icon: "🥃", label: "SCOTCH BASE", meta: "LAGAVULIN · 48°",
    recipes: [
      {
        name: "스카치 하이볼", abv: "17°",
        ingredients: [
          { label: "라가불린 30", type: "base" },
          { label: "사이다 40", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "라가불린" }, { text: "사이다 천천히 붓기" }, { text: "🚫 절대 섞지 않음", warn: true }],
      },
      {
        name: "라가불린 사워", abv: "27°",
        ingredients: [
          { label: "라가불린 40", type: "base" },
          { label: "레몬 20", type: "normal" },
          { label: "설탕 1tsp", type: "sugar" },
        ],
        guideType: "stir",
        steps: [{ text: "설탕" }, { text: "레몬" }, { text: "라가불린" }, { text: "강하게 스터 15–20초" }],
      },
      {
        name: "갓파더", abv: "32°",
        ingredients: [
          { label: "라가불린 40", type: "base" },
          { label: "깔루아 20", type: "normal" },
        ],
        guideType: "build",
        steps: [{ text: "라가불린" }, { text: "깔루아" }, { text: "가볍게 스터" }],
        noteSub: "※ 원래는 아마레또 — 깔루아로 대체",
      },
    ],
  },
  {
    icon: "☕", label: "LIQUEUR COMBO", meta: "Kahlúa 16° · Bailey's / Mozart 17°",
    recipes: [
      {
        name: "에인절스 키스", abv: "17°",
        ingredients: [
          { label: "깔루아 30", type: "base" },
          { label: "초콜릿 리큐르 30", type: "base" },
        ],
        guideType: "layer",
        steps: [
          { text: "깔루아" },
          { text: "스푼 뒤집어 잔 벽면에 대고" },
          { text: "초콜릿 리큐르 천천히" },
          { text: "🚫 섞지 않음", warn: true },
        ],
      },
      {
        name: "B-52", nameTag: "트리플섹 잔여량 한정", abv: "24°",
        ingredients: [
          { label: "깔루아 20", type: "base" },
          { label: "초콜릿 리큐르 20", type: "base" },
          { label: "트리플섹 20", type: "normal" },
        ],
        guideType: "layer",
        steps: [
          { text: "깔루아" },
          { text: "스푼 대고 초콜릿 리큐르" },
          { text: "스푼 대고 트리플섹" },
          { text: "🚫 섞지 않음", warn: true },
        ],
        noteSub: "※ 밀도 무거운 순서 — 깔루아가 가장 아래",
      },
    ],
  },
];

const footerRules = [
  "탄산은 항상 마지막 투입, 섞지 않기",
  "레이어드: 바 스푼 뒤집어 잔 벽면에 천천히",
  "설탕 1tsp ≈ 5g",
  "초콜릿 리큐르: 베일리스 또는 모차르트 초콜릿 크림",
];

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────

const METHOD_LABEL: Record<GuideType, string> = {
  build: "BUILD",
  stir: "STIR",
  layer: "LAYER",
};

const methodColors = (type: GuideType) => {
  if (type === "stir")  return { dot: C.stir,  bg: C.stirDim,  text: C.stir };
  if (type === "layer") return { dot: C.layer, bg: C.layerDim, text: C.layer };
  return                       { dot: C.build, bg: C.buildDim, text: C.build };
};

// ── 서브 컴포넌트 ─────────────────────────────────────────────────────────────

const IngTag: React.FC<{ ing: Ingredient }> = ({ ing }) => {
  const base: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "calc(0.67rem * 1.25)",
    padding: "3px 9px",
    borderRadius: "3px",
    letterSpacing: "0.04em",
    border: "1px solid",
    whiteSpace: "nowrap",
  };
  if (ing.type === "base") return (
    <span style={{ ...base, color: C.baseTag, background: C.baseBg, borderColor: C.baseTag }}>
      {ing.label}
    </span>
  );
  if (ing.type === "sugar") return (
    <span style={{ ...base, color: C.sugarTag, background: C.sugarBg, borderColor: "#2a3440" }}>
      {ing.label}
    </span>
  );
  return (
    <span style={{ ...base, color: C.text, background: "#111820", borderColor: C.border }}>
      {ing.label}
    </span>
  );
};

const GuideSteps: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
  const mc = methodColors(recipe.guideType);
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", marginTop: "8px" }}>
      {/* 메서드 배지 */}
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.58rem",
        letterSpacing: "0.12em",
        fontWeight: 500,
        color: mc.text,
        background: mc.bg,
        border: `1px solid ${mc.dot}40`,
        padding: "2px 7px",
        borderRadius: "3px",
        whiteSpace: "nowrap",
        marginTop: "1px",
        flexShrink: 0,
      }}>
        {METHOD_LABEL[recipe.guideType]}
      </span>

      {/* 스텝 목록 */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "3px" }}>
        {recipe.steps.map((s, i) => (
          <React.Fragment key={i}>
            {i > 0 && !s.warn && (
              <span style={{ color: C.muted, opacity: 0.7, margin: "0 1px", fontSize: "calc(0.65rem * 1.25)" }}>→</span>
            )}
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.67rem * 1.25)",
              letterSpacing: "0.03em",
              color: s.warn ? C.warn : C.text,
              fontWeight: s.warn ? 600 : 400,
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

const RecipeRow: React.FC<{ recipe: Recipe }> = ({ recipe }) => {
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
      {/* 이름 + ABV */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px", gap: "8px" }}>
        <span style={{ fontSize: "calc(0.88rem * 1.25)", fontWeight: 500, color: "#dde8f2", letterSpacing: "0.02em" }}>
          {recipe.name}
          {recipe.nameTag && (
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.58rem * 1.25)",
              color: C.warn,
              background: C.warnDim,
              border: `1px solid ${C.warn}40`,
              padding: "1px 6px",
              borderRadius: "3px",
              letterSpacing: "0.06em",
              marginLeft: "8px",
              verticalAlign: "middle",
            }}>
              {recipe.nameTag}
            </span>
          )}
        </span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "calc(0.72rem * 1.25)", color: C.build, flexShrink: 0, fontWeight: 500 }}>
          {recipe.abv}
        </span>
      </div>

      {/* 재료 태그 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "2px" }}>
        {recipe.ingredients.map((ing) => (
          <IngTag key={ing.label} ing={ing} />
        ))}
      </div>

      {/* 가이드 스텝 */}
      <GuideSteps recipe={recipe} />

      {/* 보조 노트 */}
      {recipe.noteSub && (
        <div style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6rem",
          color: C.muted,
          marginTop: "6px",
          paddingLeft: "2px",
          letterSpacing: "0.04em",
        }}>
          {recipe.noteSub}
        </div>
      )}
    </div>
  );
};

const SectionCard: React.FC<{ section: GuideSection; delay: number }> = ({ section, delay }) => (
  <div
    className="guide-section-card"
    style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: "4px",
      overflow: "hidden",
      animationDelay: `${delay}s`,
    }}
  >
    {/* 섹션 헤더 */}
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "11px 16px",
      borderBottom: `1px solid ${C.border}`,
      background: "rgba(240,160,48,0.04)",
    }}>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "calc(0.72rem * 1.25)",
        letterSpacing: "0.2em",
        color: C.build,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontWeight: 500,
      }}>
        {section.label}
      </div>
      <div style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "calc(0.62rem * 1.25)",
        color: C.muted,
        letterSpacing: "0.1em",
      }}>
        {section.meta}
      </div>
    </div>

    {/* 레시피 목록 */}
    {section.recipes.map((recipe, i) => (
      <div key={recipe.name} style={{ borderBottom: i < section.recipes.length - 1 ? undefined : "none" }}>
        <RecipeRow recipe={recipe} />
      </div>
    ))}
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const HouseBarGuide: React.FC = () => {
  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Noto+Sans+KR:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .guide-header { animation: fadeIn 0.5s ease both; }
        .guide-legend { animation: fadeIn 0.5s 0.1s ease both; }
        .guide-section-card { animation: fadeUp 0.5s ease both; }
        .guide-footer { animation: fadeIn 0.5s 0.4s ease both; }

        @media (max-width: 600px) {
          .guide-grid { grid-template-columns: 1fr !important; }
          .guide-header { flex-direction: column; align-items: flex-start !important; gap: 8px; }
          .guide-header-right { text-align: left !important; }
        }
      `}</style>

      <div style={{
        background: C.bg,
        color: C.text,
        fontFamily: "'Noto Sans KR', sans-serif",
        fontWeight: 300,
        fontSize: "13px",
        lineHeight: 1.6,
        minHeight: "100vh",
        padding: "32px 20px 80px",
      }}>

        {/* ── Header ── */}
        <header className="guide-header" style={{
          maxWidth: "1100px",
          margin: "0 auto 36px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.border}`,
          paddingBottom: "16px",
        }}>
          <div>
            <h1 style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "1.15rem",
              fontWeight: 500,
              letterSpacing: "0.15em",
              color: C.build,
            }}>
              주조 가이드
            </h1>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.65rem * 1.125)",
              color: C.muted,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              marginTop: "4px",
            }}>
              Cocktail Recipe Reference
            </p>
          </div>
          <div className="guide-header-right" style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "calc(0.65rem * 1.125)",
            color: C.muted,
            letterSpacing: "0.12em",
            textAlign: "right",
            lineHeight: 1.8,
          }}>
            단위 <span style={{ color: C.build }}>cc</span>
            &nbsp;|&nbsp; 최대 단일 재료 <span style={{ color: C.build }}>40cc</span>
            <br />
            쉐이커 없음 &nbsp;|&nbsp; 얼음 없음
          </div>
        </header>

        {/* ── Legend ── */}
        <div className="guide-legend" style={{
          maxWidth: "1100px",
          margin: "0 auto 28px",
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
        }}>
          {[
            { color: C.build, label: "BUILD — 잔에 순서대로" },
            { color: C.stir,  label: "STIR — 강하게 젓기 15–20초" },
            { color: C.layer, label: "LAYER — 스푼 뒤집어 천천히" },
            { color: C.warn,  label: "NO STIR — 탄산 보호" },
          ].map((item) => (
            <div key={item.label} style={{
              display: "flex", alignItems: "center", gap: "7px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "calc(0.66rem * 1.125)",
              color: item.color,
              letterSpacing: "0.1em",
            }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: item.color, flexShrink: 0 }} />
              {item.label}
            </div>
          ))}
        </div>

        {/* ── Grid ── */}
        <div className="guide-grid" style={{
          maxWidth: "1100px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "16px",
        }}>
          {guideData.map((section, i) => (
            <SectionCard key={section.label} section={section} delay={0.05 + i * 0.05} />
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="guide-footer" style={{
          maxWidth: "1100px",
          margin: "40px auto 0",
          borderTop: `1px solid ${C.border}`,
          paddingTop: "16px",
          display: "flex",
          flexWrap: "wrap",
          gap: "20px",
          justifyContent: "space-between",
        }}>
          {footerRules.map((rule) => (
            <div key={rule} style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.62rem",
              color: C.muted,
              letterSpacing: "0.08em",
              display: "flex",
              alignItems: "center",
              gap: "8px",
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