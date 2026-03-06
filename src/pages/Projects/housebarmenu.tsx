import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
  SpiritKey
} from "../../components/util/HouseBar/houseType.tsx";
import {
  isSpiritAvailable,
  isLiqueurSectionAvailable,
  isRecipeAvailable,
  getSpiritMenuBase,
  getLiqueurGuideMeta
} from "../../components/util/HouseBar/houseBottle.tsx";
import { allSections, UnifiedRecipe } from "../../components/util/HouseBar/guideData.tsx";

// 스타일 

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: "#0d0b08",
    backgroundImage:
      "radial-gradient(ellipse at 20% 20%, rgba(201,168,76,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(201,168,76,0.03) 0%, transparent 50%)",
    color: "#f0e8d8",
    fontFamily: "'Noto Serif KR', serif",
    minHeight: "100vh",
    padding: "60px 20px 80px",
  },
  header: { textAlign: "center", marginBottom: "64px" },
  headerLine: {
    width: "80px", height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
    margin: "0 auto 24px",
  },
  headerLineBottom: {
    width: "120px", height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
    margin: "20px auto 0",
  },
  h1: {
    fontFamily: "'Noto Serif KR', sans-serif",
    fontSize: "clamp(2.4rem, 6vw, 4rem)",
    fontWeight: 400, letterSpacing: "0.12em",
    color: "#e8c97a", lineHeight: 1.1,
  },
  subtitle: {
    marginTop: "12px", fontSize: "0.8rem",
    letterSpacing: "0.3em", textTransform: "uppercase",
    color: "#7a6e60", fontWeight: 300,
  },
  sectionsGrid: {
    maxWidth: "960px", margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "36px",
  },
  sectionHeader: {
    display: "flex", alignItems: "center", gap: "12px",
    marginBottom: "20px", paddingBottom: "14px",
    borderBottom: "1px solid #2a241c",
  },
  sectionIcon: { fontSize: "1.3rem" },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "calc(1.05rem * 1.125)", fontWeight: 400,
    letterSpacing: "0.1em", color: "#c9a84c",
  },
  sectionBase: {
    fontSize: "calc(0.65rem * 1.125)", letterSpacing: "0.15em",
    textTransform: "uppercase", color: "#8d8276",
    marginLeft: "auto", fontWeight: 300,
    textAlign: "right", lineHeight: 1.4,
    maxWidth: "55%", whiteSpace: "pre-line",
  },
  drinkList: {
    listStyle: "none", display: "flex", flexDirection: "column",
    gap: "2px", padding: 0, margin: 0,
  },
  drinkItem: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "11px 14px", borderRadius: "6px",
    cursor: "default", transition: "background 0.2s ease",
  },
  drinkInfo: { display: "flex", flexDirection: "column", gap: "3px" },
  drinkName: {
    fontSize: "calc(0.93rem * 1.125)", fontWeight: 400,
    color: "#f0e8d8", letterSpacing: "0.02em",
  },
  drinkDesc: {
    fontSize: "calc(0.72rem * 1.125)", color: "#8d8276",
    fontWeight: 300, letterSpacing: "0.03em", lineHeight: 1.4,
  },
  drinkAbv: {
    fontFamily: "'Playfair Display', serif", fontStyle: "italic",
    fontSize: "calc(0.82rem * 1.25)", color: "#c9a84c",
    whiteSpace: "nowrap", marginLeft: "12px",
  },
  footer: {
    textAlign: "center", marginTop: "72px",
    color: "#7a6e60", fontSize: "0.72rem",
    letterSpacing: "0.2em", textTransform: "uppercase",
  },
  footerLine: {
    width: "60px", height: "1px",
    background: "linear-gradient(90deg, transparent, #2a241c, transparent)",
    margin: "0 auto 16px",
  },
};

//  필터링 
interface FilteredSection {
  sectionKey: string;
  icon: string;
  menuTitle: string;
  base: string;
  recipes: UnifiedRecipe[];
}

function getFilteredSections(): FilteredSection[] {
  return allSections
    .filter((section) => {
      if (section.sectionKey === "liqueur") return isLiqueurSectionAvailable();
      return isSpiritAvailable(section.sectionKey as SpiritKey);
    })
    .map((section) => {
      const base =
        section.sectionKey === "liqueur"
          ? getLiqueurGuideMeta()
          : getSpiritMenuBase(section.sectionKey as SpiritKey);

      const recipes = section.recipes.filter((r) =>
        isRecipeAvailable({
          guideType: r.guideType,
          spiritKey: r.spiritKey,
          requiresSpiritKeys: r.requiresSpiritKeys,
          requiresLiqueurCategories: r.requiresLiqueurCategories,
          requiresMixerCategories: r.requiresMixerCategories,
        })
      );

      return { ...section, base, recipes };
    })
    .filter((s) => s.recipes.length > 0);
}

//  서브 컴포넌트 
const DrinkItem: React.FC<{ recipe: UnifiedRecipe }> = ({ recipe }) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <li
      style={{ ...styles.drinkItem, background: hovered ? "#1e1810" : "transparent" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.drinkInfo}>
        <span style={styles.drinkName}>
          {recipe.name}
        </span>
        <span style={styles.drinkDesc}>{recipe.desc}</span>
      </div>
      <span style={styles.drinkAbv}>{recipe.abv}</span>
    </li>
  );
};

const MenuSection: React.FC<{ section: FilteredSection }> = ({ section }) => (
  <div>
    <div style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{section.icon}</span>
      <span style={styles.sectionTitle}>{section.menuTitle}</span>
      <span style={styles.sectionBase as React.CSSProperties}>{section.base}</span>
    </div>
    <ul style={styles.drinkList}>
      {section.recipes.map((recipe) => (
        <DrinkItem key={recipe.name} recipe={recipe} />
      ))}
    </ul>
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const HouseBarMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const barname = decodeURIComponent(searchParams.get("n") ?? "");
  const [Name, setName] = useState<string>("My Bar");

  useEffect(() => {
    if (barname.trim().length > 0) setName(barname);
  }, [barname]);

  const filteredSections = getFilteredSections();

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Serif+KR:wght@300;400&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .bar-header { animation: fadeDown 2s ease both; }
        .bar-section:nth-child(1) { animation: fadeUp 0.7s ease 0.1s both; }
        .bar-section:nth-child(2) { animation: fadeUp 0.7s ease 0.2s both; }
        .bar-section:nth-child(3) { animation: fadeUp 0.7s ease 0.3s both; }
        .bar-section:nth-child(4) { animation: fadeUp 0.7s ease 0.4s both; }
        .bar-section:nth-child(5) { animation: fadeUp 0.7s ease 0.5s both; }
        .bar-section:nth-child(6) { animation: fadeUp 0.7s ease 0.6s both; }
        .bar-section:nth-child(7) { animation: fadeUp 0.7s ease 0.7s both; }
        .bar-section:nth-child(8) { animation: fadeUp 0.7s ease 0.8s both; }
        .bar-section:nth-child(9) { animation: fadeUp 0.7s ease 0.9s both; }
        .bar-section:nth-child(10) { animation: fadeUp 0.7s ease 1s both; }
        .bar-section:nth-child(11) { animation: fadeUp 0.7s ease 1.1s both; }
        .bar-section:nth-child(12) { animation: fadeUp 0.7s ease 1.2s both; }
        .bar-section:nth-child(13) { animation: fadeUp 0.7s ease 1.3s both; }
        .bar-footer { animation: fadeUp 1.5s ease 1.5s both; }
        @media (max-width: 480px) {
          .bar-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .bar-body { padding: 40px 16px 60px !important; }
        }
      `}</style>

      <div className="bar-body" style={styles.body}>
        <header className="bar-header" style={styles.header}>
          <div style={styles.headerLine} />
          <h1 style={styles.h1}>{Name}</h1>
          <p style={styles.subtitle as React.CSSProperties}>House Cocktail Menu</p>
          <div style={styles.headerLineBottom} />
        </header>

        <div className="bar-grid" style={styles.sectionsGrid}>
          {filteredSections.map((section) => (
            <div className="bar-section" key={section.sectionKey}>
              <MenuSection section={section} />
            </div>
          ))}
        </div>

        <footer className="bar-footer" style={styles.footer as React.CSSProperties}>
          <div style={styles.footerLine} />
          Enjoy Responsibly
        </footer>
      </div>
    </>
  );
};

export default HouseBarMenu;