"use client";

// ─── Types ───────────────────────────────────────────────────────────────────

type DestTag = "PF" | "PPT" | "SCR";
type SourceKey =
  | "ward_profile"
  | "statscan_da"
  | "cmhc"
  | "walkscore"
  | "toronto_open_data"
  | "rlb_cbre"
  | "city_toronto"
  | "boc"
  | "tarion";

interface CardDef {
  category: string;
  title: string;
  badge?: { label: string; color: "green" | "red" };
  body: string;
  sources: { key: SourceKey; label: string }[];
  destinations: DestTag[];
}

interface SectionDef {
  number: number;
  label: string;
  cards: CardDef[];
}

// ─── Static data ─────────────────────────────────────────────────────────────

const SOURCE_META: Record<
  SourceKey,
  { bg: string; text: string; border?: string; href: string }
> = {
  ward_profile: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    href: "https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/ward-profiles/",
  },
  statscan_da: {
    bg: "#F0F9FF",
    text: "#0369A1",
    href: "https://www12.statcan.gc.ca/wds-sdw/",
  },
  cmhc: {
    bg: "#FFF7ED",
    text: "#C2410C",
    href: "https://www.cmhc-schl.gc.ca/professionals/housing-markets-data-and-research/housing-data/data-tables/rental-market/rental-market-report-data-tables",
  },
  walkscore: {
    bg: "#F0FDF4",
    text: "#166534",
    href: "https://api.walkscore.com/score?format=json",
  },
  toronto_open_data: {
    bg: "#EFF6FF",
    text: "#1D4ED8",
    href: "https://open.toronto.ca/",
  },
  rlb_cbre: {
    bg: "#F8FAFC",
    text: "#475569",
    border: "#E2E8F0",
    href: "https://rlb.com/en-ca/insights/construction-cost-reports/",
  },
  city_toronto: {
    bg: "#FDF4FF",
    text: "#7E22CE",
    href: "https://www.toronto.ca/city-government/budget-finances/city-finance/development-charges/",
  },
  boc: {
    bg: "#F0FDF4",
    text: "#166534",
    href: "https://www.bankofcanada.ca/rates/banking-and-financial-statistics/posted-rates/",
  },
  tarion: {
    bg: "#FFF7ED",
    text: "#C2410C",
    href: "https://www.tarion.com/builders/fees-fines",
  },
};

const DEST_META: Record<DestTag, { bg: string; text: string; title: string }> = {
  PF: { bg: "#EFF6FF", text: "#1D4ED8", title: "Pro Forma" },
  PPT: { bg: "#F5F3FF", text: "#6D28D9", title: "PowerPoint" },
  SCR: { bg: "#F0FDF4", text: "#166534", title: "Screening only" },
};

const SECTIONS: SectionDef[] = [
  {
    number: 1,
    label: "MARKET DEMAND SIGNALS",
    cards: [
      {
        category: "WHO LIVES HERE",
        title: "Household composition",
        body: "Single-person households → 1-bed demand. Large families → 3+ bed. Drives unit mix weights in the pro forma.",
        sources: [
          { key: "ward_profile", label: "Ward Profile" },
          { key: "statscan_da", label: "Stats Can DA" },
        ],
        destinations: ["PF", "PPT"],
      },
      {
        category: "WHO LIVES HERE",
        title: "Age distribution",
        body: "High seniors → accessible design. Student-heavy → small furnished units. Young families → storage + school proximity.",
        sources: [{ key: "statscan_da", label: "Stats Can DA" }],
        destinations: ["PPT"],
      },
      {
        category: "HOUSING DEMAND",
        title: "Renter vs. owner ratio",
        body: "High renter share → purpose-built rental viable. Low renter share + rising HHI → strata exit viable. Determines exit strategy.",
        sources: [
          { key: "statscan_da", label: "Stats Can DA" },
          { key: "cmhc", label: "CMHC" },
        ],
        destinations: ["PF", "PPT"],
      },
      {
        category: "HOUSING DEMAND",
        title: "Rental vacancy rate",
        body: "Sub-2% → strong demand, rents hold. Above 5% → oversupply risk. Affects lender confidence and pro forma revenue assumptions.",
        sources: [{ key: "cmhc", label: "CMHC Rental Survey" }],
        destinations: ["PF", "PPT", "SCR"],
      },
    ],
  },
  {
    number: 2,
    label: "FINANCIAL FEASIBILITY SIGNALS",
    cards: [
      {
        category: "REVENUE CEILING",
        title: "Median household income",
        body: "30% of gross income = shelter cost threshold. Below $60K HHI → units above $1,500/mo face affordability drag.",
        sources: [
          { key: "statscan_da", label: "Stats Can DA" },
          { key: "ward_profile", label: "Ward Profile" },
        ],
        destinations: ["PF", "PPT"],
      },
      {
        category: "REVENUE CEILING",
        title: "Shelter cost / income ratio",
        body: "If 35%+ of residents already spend over threshold → cost-burdened. Validates demand but caps achievable rents.",
        sources: [{ key: "statscan_da", label: "Stats Can DA" }],
        destinations: ["PPT", "SCR"],
      },
      {
        category: "REVENUE CEILING",
        title: "Market rent by bedroom size",
        body: "Sets pro forma revenue per unit. Compare CMHC average to new-build achievable. Gap = rent premium potential or risk if too wide.",
        sources: [{ key: "cmhc", label: "CMHC Avg Rents" }],
        destinations: ["PF", "PPT"],
      },
      {
        category: "COST & RISK",
        title: "Construction cost benchmarks",
        body: "Low-rise wood-frame runs ~$200–280/sqft hard costs in Toronto. Soft costs add 20–30%. Affects break-even rent and IRR targets.",
        sources: [{ key: "rlb_cbre", label: "RLB Quarterly" }],
        destinations: ["PF"],
      },
      {
        category: "COST & RISK",
        title: "Building Cost Price Index",
        body: "StatsCan BCPI (Table 18-10-0276-01) tracks quarterly construction inflation. Applied as hard-cost escalation in pro forma timeline.",
        sources: [{ key: "statscan_da", label: "Stats Can BCPI" }],
        destinations: ["PF"],
      },
      {
        category: "COST & RISK",
        title: "Development charges (DCs)",
        body: "Toronto DCs vary by unit size. 3-bed units attract higher DCs. As-of-right multiplex may qualify for exemptions — a major feasibility lever.",
        sources: [{ key: "city_toronto", label: "City of Toronto DCs" }],
        destinations: ["PF", "SCR"],
      },
      {
        category: "COST & RISK",
        title: "CMHC MLI Select premium",
        body: "Multi-unit insurance by LTV band (1%–4%). Energy Star / net-zero discounts reduce premium by 0.25–0.75%. Wired into debt structure.",
        sources: [{ key: "cmhc", label: "CMHC MLI Select" }],
        destinations: ["PF"],
      },
      {
        category: "COST & RISK",
        title: "Tarion warranty fees",
        body: "$840/unit enrolment for freehold builds. Condo adds $335 registration. Baked into admin & warranty section of pro forma.",
        sources: [{ key: "tarion", label: "Tarion Fee Schedule" }],
        destinations: ["PF"],
      },
      {
        category: "COST & RISK",
        title: "Bank of Canada prime rate",
        body: "Construction loan rate = prime + spread (typically +200bps). BoC Valet API provides real-time rate — directly affects debt carry cost.",
        sources: [{ key: "boc", label: "BoC Valet API" }],
        destinations: ["PF"],
      },
    ],
  },
  {
    number: 3,
    label: "SITE & ZONING SIGNALS",
    cards: [
      {
        category: "ENTITLEMENT RISK",
        title: "Zoning classification",
        badge: { label: "Low risk", color: "green" },
        body: "RD / RS / RM = as-of-right multiplex (4–6 units, post-2023 bylaw). No rezoning = faster timeline, lower risk.",
        sources: [{ key: "toronto_open_data", label: "Toronto Open Data" }],
        destinations: ["PF", "PPT", "SCR"],
      },
      {
        category: "ENTITLEMENT RISK",
        title: "Lot dimensions & coverage",
        body: "Frontage, depth, and FSI/GFA limits determine how many units physically fit. Min 6m frontage per unit for rowhouse.",
        sources: [{ key: "toronto_open_data", label: "Toronto GIS" }],
        destinations: ["PF", "SCR"],
      },
      {
        category: "SITE QUALITY",
        title: "Transit proximity",
        body: "Within 500m of subway / 250m of streetcar → 10–20% rent premium. Reduces parking demand — saves $75K+ per stall in construction cost.",
        sources: [
          { key: "walkscore", label: "Walk Score API" },
          { key: "toronto_open_data", label: "TTC GTFS" },
        ],
        destinations: ["PF", "PPT"],
      },
      {
        category: "SITE QUALITY",
        title: "Walk score & school proximity",
        body: "High walk score reduces parking assumptions. Schools within 400m boost 2–3 bed family unit demand.",
        sources: [
          { key: "walkscore", label: "Walk Score API" },
          { key: "toronto_open_data", label: "Toronto Schools" },
        ],
        destinations: ["PPT", "SCR"],
      },
    ],
  },
  {
    number: 4,
    label: "SUPPLY-SIDE SIGNALS",
    cards: [
      {
        category: "PIPELINE",
        title: "Building permit history",
        body: "Rising multiplex permits = competitive supply incoming. Low count despite demand = underserved ward.",
        sources: [{ key: "toronto_open_data", label: "Toronto Permits" }],
        destinations: ["PPT", "SCR"],
      },
      {
        category: "PIPELINE",
        title: "Condo completion pipeline",
        body: "Heavy condo completions in the same submarket compress achievable rents. CMHC tracks completions quarterly.",
        sources: [{ key: "cmhc", label: "CMHC Completions" }],
        destinations: ["SCR"],
      },
      {
        category: "COMPARABLES",
        title: "Existing rental stock age",
        body: "Old stock (pre-1980) = deferred maintenance. New entrant with modern units can command 20–30% above average market rent.",
        sources: [
          { key: "statscan_da", label: "Stats Can DA" },
          { key: "ward_profile", label: "Ward Profile" },
        ],
        destinations: ["PF", "PPT"],
      },
      {
        category: "COMPARABLES",
        title: "Sale price benchmarks",
        body: "Zone-family $/PSF benchmarks (RD–CR) adjusted by ward. Sets gross terminal value for condo exit or land value back-calculation.",
        sources: [{ key: "cmhc", label: "TRREB / HouseSigma" }],
        destinations: ["PF", "SCR"],
      },
    ],
  },
  {
    number: 5,
    label: "COMMUNITY & POLICY SIGNALS",
    cards: [
      {
        category: "DISPLACEMENT RISK",
        title: "Renter tenure length",
        badge: { label: "High sensitivity", color: "red" },
        body: "Long-tenured renters (5+ years) = rent-controlled units far below market + demolition conflict risk. Screen early.",
        sources: [{ key: "statscan_da", label: "Stats Can DA" }],
        destinations: ["SCR"],
      },
      {
        category: "POLITICAL CLIMATE",
        title: "Ward council voting history",
        body: "Some councillors obstruct as-of-right permits informally (delayed sign-offs, heritage flags). Toronto ward voting records are public.",
        sources: [{ key: "city_toronto", label: "Toronto Council" }],
        destinations: ["SCR"],
      },
    ],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceBadge({ src }: { src: { key: SourceKey; label: string } }) {
  const meta = SOURCE_META[src.key];
  return (
    <a
      href={meta.href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        backgroundColor: meta.bg,
        color: meta.text,
        border: meta.border ? `0.5px solid ${meta.border}` : undefined,
        fontSize: "10px",
        fontWeight: 500,
        padding: "2px 7px",
        borderRadius: "4px",
        textDecoration: "none",
        whiteSpace: "nowrap" as const,
        lineHeight: 1.6,
      }}
    >
      {src.label}
    </a>
  );
}

function DestTag({ tag }: { tag: DestTag }) {
  const meta = DEST_META[tag];
  return (
    <span
      title={meta.title}
      style={{
        backgroundColor: meta.bg,
        color: meta.text,
        fontSize: "9px",
        fontWeight: 600,
        padding: "2px 6px",
        borderRadius: "3px",
        letterSpacing: "0.03em",
      }}
    >
      {tag}
    </span>
  );
}

function DataCard({ card }: { card: CardDef }) {
  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "0.5px solid #E2E8F0",
        borderRadius: "10px",
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
      }}
    >
      {/* Category */}
      <span
        style={{
          fontSize: "9px",
          textTransform: "uppercase" as const,
          letterSpacing: "0.07em",
          color: "#94A3B8",
          marginBottom: "3px",
        }}
      >
        {card.category}
      </span>

      {/* Title + inline badge */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "#0F172A", lineHeight: 1.4 }}>
          {card.title}
        </span>
        {card.badge && (
          <span
            style={{
              fontSize: "9px",
              fontWeight: 500,
              padding: "1px 6px",
              borderRadius: "20px",
              backgroundColor: card.badge.color === "green" ? "#F0FDF4" : "#FEF2F2",
              color: card.badge.color === "green" ? "#15803D" : "#DC2626",
              border: `0.5px solid ${card.badge.color === "green" ? "#BBF7D0" : "#FECACA"}`,
              whiteSpace: "nowrap" as const,
            }}
          >
            {card.badge.label}
          </span>
        )}
      </div>

      {/* Body */}
      <p
        style={{
          fontSize: "11px",
          color: "#64748B",
          lineHeight: 1.55,
          margin: "5px 0 10px",
        }}
      >
        {card.body}
      </p>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: "8px",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "4px" }}>
          {card.sources.map((s) => (
            <SourceBadge key={s.key + s.label} src={s} />
          ))}
        </div>
        <div style={{ display: "flex", gap: "3px", flexShrink: 0 }}>
          {card.destinations.map((d) => (
            <DestTag key={d} tag={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SectionBlock({ section }: { section: SectionDef }) {
  return (
    <div>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: "#475569",
            whiteSpace: "nowrap" as const,
          }}
        >
          {section.number} — {section.label}
        </span>
        <div style={{ flex: 1, height: "0.5px", backgroundColor: "#E2E8F0" }} />
      </div>

      {/* Card grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "8px",
        }}
      >
        {section.cards.map((card) => (
          <DataCard key={card.category + card.title} card={card} />
        ))}
      </div>
    </div>
  );
}

// ─── Legend bar ───────────────────────────────────────────────────────────────

const LEGEND_SOURCES: { key: SourceKey; label: string }[] = [
  { key: "toronto_open_data", label: "Toronto Open Data / Ward Profile" },
  { key: "statscan_da", label: "Stats Can WDS" },
  { key: "cmhc", label: "CMHC" },
  { key: "walkscore", label: "Walk Score API" },
  { key: "city_toronto", label: "City of Toronto" },
  { key: "boc", label: "Bank of Canada" },
  { key: "tarion", label: "Tarion" },
  { key: "rlb_cbre", label: "RLB / CBRE" },
];

function LegendBar() {
  return (
    <div
      style={{
        backgroundColor: "#F8FAFC",
        border: "0.5px solid #E2E8F0",
        borderRadius: "8px",
        padding: "10px 12px",
        display: "flex",
        flexWrap: "wrap" as const,
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
        marginBottom: "20px",
      }}
    >
      {/* Source dots */}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "10px", alignItems: "center" }}>
        {LEGEND_SOURCES.map((s) => {
          const meta = SOURCE_META[s.key];
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "2px",
                  backgroundColor: meta.text,
                  flexShrink: 0,
                  display: "inline-block",
                }}
              />
              <span style={{ fontSize: "10px", color: "#64748B", whiteSpace: "nowrap" as const }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Destination pills */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" as const }}>
        <span style={{ fontSize: "10px", color: "#94A3B8", marginRight: "2px" }}>Flows to:</span>
        {(Object.entries(DEST_META) as [DestTag, (typeof DEST_META)[DestTag]][]).map(
          ([tag, meta]) => (
            <div key={tag} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  backgroundColor: meta.bg,
                  color: meta.text,
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "2px 6px",
                  borderRadius: "3px",
                }}
              >
                {tag}
              </span>
              <span style={{ fontSize: "10px", color: "#94A3B8" }}>{meta.title}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function DataFrameworkSection() {
  return (
    <div style={{ width: "100%", paddingTop: "40px" }}>
      {/* Header */}
      <div style={{ marginBottom: "16px" }}>
        <h3
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "#0F172A",
            marginBottom: "3px",
            letterSpacing: "-0.01em",
          }}
        >
          Data framework
        </h3>
        <p style={{ fontSize: "11px", color: "#94A3B8", margin: 0 }}>
          30 signals across 5 layers — what gets fetched, why it matters, and where it flows.
        </p>
      </div>

      <LegendBar />

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {SECTIONS.map((s) => (
          <SectionBlock key={s.number} section={s} />
        ))}
      </div>
    </div>
  );
}
