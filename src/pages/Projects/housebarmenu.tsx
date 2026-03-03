import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom"

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
  header: {
    textAlign: "center",
    marginBottom: "64px",
  },
  headerLine: {
    width: "80px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
    margin: "0 auto 24px",
  },
  headerLineBottom: {
    width: "120px",
    height: "1px",
    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
    margin: "20px auto 0",
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(2.4rem, 6vw, 4rem)",
    fontWeight: 400,
    letterSpacing: "0.12em",
    color: "#e8c97a",
    lineHeight: 1.1,
  },
  subtitle: {
    marginTop: "12px",
    fontSize: "0.8rem",
    letterSpacing: "0.3em",
    textTransform: "uppercase",
    color: "#7a6e60",
    fontWeight: 300,
  },
  sectionsGrid: {
    maxWidth: "960px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "36px",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "20px",
    paddingBottom: "14px",
    borderBottom: "1px solid #2a241c",
  },
  sectionIcon: {
    fontSize: "1.3rem",
  },
  sectionTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "calc(1.05rem * 1.125)",
    fontWeight: 400,
    letterSpacing: "0.1em",
    color: "#c9a84c",
  },
  sectionBase: {
    fontSize: "calc(0.68rem * 1.125)",
    letterSpacing: "0.25em",
    textTransform: "uppercase",
    color: "#7a6e60",
    marginLeft: "auto",
    fontWeight: 300,
  },
  drinkList: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    padding: 0,
    margin: 0,
  },
  drinkItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "11px 14px",
    borderRadius: "6px",
    cursor: "default",
    transition: "background 0.2s ease",
  },
  drinkInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },
  drinkName: {
    fontSize: "calc(0.93rem * 1.125)",
    fontWeight: 400,
    color: "#f0e8d8",
    letterSpacing: "0.02em",
  },
  drinkDesc: {
    fontSize: "calc(0.72rem * 1.125)",
    color: "#7a6e60",
    fontWeight: 300,
    letterSpacing: "0.03em",
    lineHeight: 1.4,
  },
  drinkAbv: {
    fontFamily: "'Playfair Display', serif",
    fontStyle: "italic",
    fontSize: "calc(0.82rem * 1.25)",
    color: "#c9a84c",
    whiteSpace: "nowrap",
    marginLeft: "12px",
  },
  noteTag: {
    fontSize: "calc(0.65rem * 1.125)",
    background: "rgba(201,168,76,0.12)",
    color: "#c9a84c",
    padding: "2px 7px",
    borderRadius: "20px",
    marginLeft: "8px",
    letterSpacing: "0.05em",
    verticalAlign: "middle",
  },
  footer: {
    textAlign: "center",
    marginTop: "72px",
    color: "#7a6e60",
    fontSize: "0.72rem",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
  },
  footerLine: {
    width: "60px",
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, #2a241c, transparent)",
    margin: "0 auto 16px",
  },
};

// ── 데이터 ──────────────────────────────────────────────────────────────────

interface Drink {
  name: string;
  nameTag?: string;
  desc: string;
  abv: string;
}

interface Section {
  icon: string;
  title: string;
  base: string;
  drinks: Drink[];
}

const menuData: Section[] = [
  {
    icon: "🍶",
    title: "Vodka",
    base: "40°",
    drinks: [
      { name: "스크류드라이버", desc: "싱그러운 오렌지 과즙, 가볍고 청량한 시작", abv: "17°" },
      { name: "블랙 러시안", desc: "진한 커피 향과 달콤한 여운, 묵직한 깊이감", abv: "32°" },
      { name: "초콜릿 러시안", desc: "카카오와 커피가 어우러진 부드럽고 달콤한 향", abv: "28°" },
      { name: "보드카 사워", desc: "레몬의 선명한 산미, 깔끔하게 떨어지는 뒷맛", abv: "27°" },
      { name: "보드카 콜린스", desc: "레몬의 산뜻함에 탄산이 더해진 가볍고 청량한 맛", abv: "16°" },
      { name: "보드카 피즈", desc: "거품처럼 가벼운 탄산과 은은한 시트러스 향", abv: "14°" },
    ],
  },
  {
    icon: "🍹",
    title: "Rum",
    base: "40°",
    drinks: [
      { name: "쿠바 리브레", desc: "콜라의 달콤함 속에 라임이 남기는 상쾌한 여운", abv: "15°" },
      { name: "다이키리", desc: "라임의 생동감 있는 산미와 깨끗한 럼의 조화", abv: "27°" },
      { name: "럼 사워", desc: "달콤함과 신맛이 균형을 이루는 고전적인 풍미", abv: "27°" },
      { name: "럼 콜린스", desc: "레몬과 탄산이 더한 청량감, 긴 여름날 같은 맛", abv: "16°" },
      { name: "럼 피즈", desc: "부드러운 럼 베이스에 탄산이 살짝 얹힌 가벼운 맛", abv: "14°" },
    ],
  },
  {
    icon: "🥃",
    title: "Whisky",
    base: "Suntory 40°",
    drinks: [
      { name: "하이볼", desc: "위스키의 우드 향이 탄산에 실려 가볍게 퍼지는 맛", abv: "17°" },
      { name: "위스키 사워", desc: "스모키한 곡물 향과 레몬의 산미가 만드는 긴장감", abv: "27°" },
      { name: "존 콜린스", desc: "위스키의 온기에 레몬과 탄산이 더한 시원한 균형", abv: "16°" },
      { name: "위스키 오렌지", desc: "오렌지 과즙이 위스키를 부드럽게 감싸는 맛", abv: "17°" },
    ],
  },
  {
    icon: "🌿",
    title: "Gin",
    base: "Masaharu 47°",
    drinks: [
      { name: "짐렛", desc: "진의 허브 향과 라임의 날카로운 산미가 공존", abv: "31°" },
      { name: "진 사워", desc: "보태니컬의 복잡한 향 위로 레몬이 선명하게 올라오는 맛", abv: "31°" },
      { name: "톰 콜린스", desc: "진의 풀내음에 레몬과 탄산이 더해진 정통 롱드링크", abv: "19°" },
      { name: "진 피즈", desc: "허브 향이 탄산 속에 녹아드는 산뜻하고 가벼운 맛", abv: "16°" },
      { name: "진 오렌지", desc: "오렌지 과즙이 진의 풀향을 부드럽게 중화시키는 맛", abv: "20°" },
    ],
  },
  {
    icon: "🥃",
    title: "Scotch",
    base: "Balvenie 40°",
    drinks: [
      { name: "스카치 하이볼", desc: "발베니의 꿀 향과 오크가 탄산과 함께 부드럽게 퍼짐", abv: "17°" },
      { name: "발베니 사워", desc: "싱글몰트의 복합적인 향에 레몬이 더한 섬세한 긴장감", abv: "27°" },
      { name: "갓파더", desc: "스카치의 스모키함과 깔루아의 달콤함이 만드는 강렬한 여운", abv: "32°" },
    ],
  },
  {
    icon: "☕",
    title: "Liqueur",
    base: "Combo",
    drinks: [
      { name: "에인절스 키스", desc: "커피 리큐르 위에 베일리스가 녹아드는 실크 같은 달콤함", abv: "17°" },
      { name: "B-52", nameTag: "잔여량 한정", desc: "커피, 크림, 오렌지가 층층이 쌓인 풍미의 삼중주", abv: "24°" },
    ],
  },
];

// ── 컴포넌트 ─────────────────────────────────────────────────────────────────

const DrinkItem: React.FC<{ drink: Drink }> = ({ drink }) => {
  const [hovered, setHovered] = React.useState(false);

  return (
    <li
      style={{
        ...styles.drinkItem,
        background: hovered ? "#1e1810" : "transparent",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={styles.drinkInfo}>
        <span style={styles.drinkName}>
          {drink.name}
          {drink.nameTag && <span style={styles.noteTag}>{drink.nameTag}</span>}
        </span>
        <span style={styles.drinkDesc}>{drink.desc}</span>
      </div>
      <span style={styles.drinkAbv}>{drink.abv}</span>
    </li>
  );
};

const MenuSection: React.FC<{ section: Section }> = ({ section }) => (
  <div>
    <div style={styles.sectionHeader}>
      <span style={styles.sectionIcon}>{section.icon}</span>
      <span style={styles.sectionTitle}>{section.title}</span>
      <span style={styles.sectionBase as React.CSSProperties}>{section.base}</span>
    </div>
    <ul style={styles.drinkList}>
      {section.drinks.map((drink) => (
        <DrinkItem key={drink.name} drink={drink} />
      ))}
    </ul>
  </div>
);

const HouseBarMenu: React.FC = () => {
  const [searchParams] = useSearchParams();
  const barname: string = decodeURIComponent(searchParams.get('n'));
  const [Name, setName] = useState<string>("My Bar");

  useEffect(() => {
    if (barname != "null" && barname.trim().length > 0) {
      setName(barname);
    }
  }, [barname]);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Noto+Serif+KR:wght@300;400;600&display=swap"
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
        .bar-header { animation: fadeDown 0.8s ease both; }
        .bar-section:nth-child(1) { animation: fadeUp 0.7s ease 0.1s both; }
        .bar-section:nth-child(2) { animation: fadeUp 0.7s ease 0.2s both; }
        .bar-section:nth-child(3) { animation: fadeUp 0.7s ease 0.3s both; }
        .bar-section:nth-child(4) { animation: fadeUp 0.7s ease 0.4s both; }
        .bar-section:nth-child(5) { animation: fadeUp 0.7s ease 0.5s both; }
        .bar-section:nth-child(6) { animation: fadeUp 0.7s ease 0.6s both; }
        .bar-footer { animation: fadeUp 1s ease 0.7s both; }
        @media (max-width: 480px) {
          .bar-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .bar-body { padding: 40px 16px 60px !important; }
        }
      `}</style>

      <div className="bar-body" style={styles.body}>
        {/* Header */}
        <header className="bar-header" style={styles.header}>
          <div style={styles.headerLine} />
          <h1 style={styles.h1}>{Name}</h1>
          <p style={styles.subtitle as React.CSSProperties}>House Cocktail Menu</p>
          <div style={styles.headerLineBottom} />
        </header>

        {/* Menu Grid */}
        <div className="bar-grid" style={styles.sectionsGrid}>
          {menuData.map((section) => (
            <div className="bar-section" key={section.title}>
              <MenuSection section={section} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="bar-footer" style={styles.footer as React.CSSProperties}>
          <div style={styles.footerLine} />
          Enjoy Responsibly
        </footer>
      </div>
    </>
  );
};

export default HouseBarMenu;