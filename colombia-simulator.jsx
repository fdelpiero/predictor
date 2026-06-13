import { useState, useCallback } from "react";

// ─── DATA ────────────────────────────────────────────────────────────────────

const GROUP_MATCHES = [
  {
    id: "g1",
    date: "17 Jun",
    home: "🇺🇿 Uzbekistán",
    away: "🇨🇴 Colombia",
    venue: "Estadio Azteca, México",
    colSide: "away",
  },
  {
    id: "g2",
    date: "23 Jun",
    home: "🇨🇴 Colombia",
    away: "🇨🇩 RD Congo",
    venue: "Estadio Akron, Guadalajara",
    colSide: "home",
  },
  {
    id: "g3",
    date: "27 Jun",
    home: "🇨🇴 Colombia",
    away: "🇵🇹 Portugal",
    venue: "Hard Rock Stadium, Miami",
    colSide: "home",
  },
];

const KNOCKOUT_ROUNDS = [
  {
    id: "r32",
    label: "Octavos",
    sub: "Round of 32",
    opponents: {
      1: "3ro Grupo D/E/I/J/L",
      2: "2do Grupo G",
    },
    note: "Si Colombia termina 1ª enfrenta un 3er lugar; si 2ª, al 2do del Grupo G",
  },
  {
    id: "r16",
    label: "16avos",
    sub: "Round of 16",
    opponents: {
      1: "Rival del cuadrante K",
      2: "Rival del cuadrante K",
    },
    note: "Posibles rivales: España, Bélgica o Uruguay según cuadrante",
  },
  {
    id: "qf",
    label: "Cuartos",
    sub: "Quarterfinals",
    opponents: { 1: "TBD", 2: "TBD" },
    note: "Potenciales rivales: Francia, Brasil o Alemania",
  },
  {
    id: "sf",
    label: "Semis",
    sub: "Semifinal",
    opponents: { 1: "TBD", 2: "TBD" },
    note: "Entre los 4 mejores del planeta",
  },
  {
    id: "final",
    label: "Final",
    sub: "19 Jul · MetLife NJ",
    opponents: { 1: "TBD", 2: "TBD" },
    note: "La gran final del Mundial 2026",
  },
];

const RIVAL_OPTIONS = {
  r32: ["3ro Grupo D", "3ro Grupo E", "3ro Grupo I", "3ro Grupo J", "2do Grupo G"],
  r16: ["España 🇪🇸", "Bélgica 🇧🇪", "Uruguay 🇺🇾", "Suiza 🇨🇭"],
  qf: ["Francia 🇫🇷", "Brasil 🇧🇷", "Alemania 🇩🇪", "Países Bajos 🇳🇱"],
  sf: ["Argentina 🇦🇷", "Inglaterra 🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Portugal 🇵🇹", "España 🇪🇸"],
  final: ["Argentina 🇦🇷", "Francia 🇫🇷", "Brasil 🇧🇷", "Alemania 🇩🇪"],
};

const TROPHY_EMOJIS = ["💀", "😬", "😐", "🔥", "⚡", "🏆"];

function getResult(prob) {
  if (prob >= 90) return { text: "Victoria segura 🔥", color: "#00C851" };
  if (prob >= 70) return { text: "Victoria probable ✅", color: "#4CAF50" };
  if (prob >= 50) return { text: "Partido equilibrado ⚖️", color: "#FFC107" };
  if (prob >= 35) return { text: "Difícil pero posible 😬", color: "#FF9800" };
  return { text: "Muy complicado ❌", color: "#F44336" };
}

function overallChance(groupProbs, knockoutProbs) {
  const groupOk = groupProbs.filter((p) => p >= 50).length >= 2;
  if (!groupOk) return 0;
  let chance = 1;
  knockoutProbs.forEach((p) => (chance *= p / 100));
  return Math.round(chance * 100);
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function ProbSlider({ value, onChange, label }) {
  const { text, color } = getResult(value);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: "#aaa", fontFamily: "monospace" }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{value}%</span>
      </div>
      <input
        type="range"
        min={5}
        max={95}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, cursor: "pointer" }}
      />
      <div style={{ fontSize: 11, color, textAlign: "right", marginTop: 2 }}>{text}</div>
    </div>
  );
}

function GroupCard({ match, prob, onChange }) {
  const colWin = (match.colSide === "home" ? prob : 100 - prob) >= 50;
  const res = getResult(match.colSide === "home" ? prob : 100 - prob);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: "#FCD116", fontWeight: 600, letterSpacing: 1 }}>
          {match.date} · {match.venue}
        </span>
        <span style={{ fontSize: 18 }}>{colWin ? "🟡" : "⚫"}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        <span style={{ flex: 1, textAlign: "right" }}>{match.home}</span>
        <span style={{ color: "#555", fontSize: 11 }}>vs</span>
        <span style={{ flex: 1 }}>{match.away}</span>
      </div>
      <ProbSlider
        label={`Prob. victoria ${match.home}`}
        value={prob}
        onChange={onChange}
      />
    </div>
  );
}

function KnockoutCard({ round, prob, rival, onProbChange, onRivalChange, reached, isEliminated }) {
  const { text, color } = getResult(prob);
  const options = RIVAL_OPTIONS[round.id] || [];

  return (
    <div
      style={{
        background: reached
          ? "rgba(252, 209, 22, 0.06)"
          : "rgba(255,255,255,0.02)",
        border: `1px solid ${reached ? "rgba(252,209,22,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        opacity: isEliminated ? 0.4 : 1,
        transition: "all 0.3s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <span
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: reached ? "#FCD116" : "#666",
              letterSpacing: -0.5,
            }}
          >
            {round.label}
          </span>
          <span style={{ fontSize: 11, color: "#555", marginLeft: 8 }}>{round.sub}</span>
        </div>
        {reached && !isEliminated && (
          <span style={{ fontSize: 20 }}>🟡</span>
        )}
        {isEliminated && <span style={{ fontSize: 20 }}>💀</span>}
      </div>

      {options.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 11, color: "#888", display: "block", marginBottom: 4 }}>
            Rival hipotético:
          </label>
          <select
            value={rival}
            onChange={(e) => onRivalChange(e.target.value)}
            style={{
              background: "#1a1a1a",
              border: "1px solid #333",
              color: "#fff",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 12,
              width: "100%",
            }}
            disabled={isEliminated}
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
        🤔 {round.note}
      </div>

      <ProbSlider
        label={`Prob. Colombia avanza`}
        value={prob}
        onChange={onProbChange}
      />
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function ColombiaSimulator() {
  const [groupProbs, setGroupProbs] = useState([55, 65, 40]);
  const [knockoutProbs, setKnockoutProbs] = useState([70, 55, 45, 40, 35]);
  const [rivals, setRivals] = useState({
    r32: RIVAL_OPTIONS.r32[0],
    r16: RIVAL_OPTIONS.r16[0],
    qf: RIVAL_OPTIONS.qf[0],
    sf: RIVAL_OPTIONS.sf[0],
    final: RIVAL_OPTIONS.final[0],
  });

  const updateGroup = useCallback((i, v) => {
    setGroupProbs((prev) => prev.map((p, idx) => (idx === i ? v : p)));
  }, []);

  const updateKnockout = useCallback((i, v) => {
    setKnockoutProbs((prev) => prev.map((p, idx) => (idx === i ? v : p)));
  }, []);

  // Colombia side prob
  const colGroupProbs = GROUP_MATCHES.map((m, i) =>
    m.colSide === "home" ? groupProbs[i] : 100 - groupProbs[i]
  );

  const wins = colGroupProbs.filter((p) => p >= 50).length;
  const qualified = wins >= 2;

  // Knockout: cumulative reached/eliminated
  const knockoutReached = [true]; // always reaches R32 if qualified
  for (let i = 1; i < KNOCKOUT_ROUNDS.length; i++) {
    knockoutReached.push(qualified && knockoutProbs[i - 1] >= 50);
  }

  // "Best round reached" string
  let bestRound = qualified ? "Fase de Grupos ✅" : "Fase de Grupos ❌";
  if (qualified) {
    const labels = ["Octavos", "16avos", "Cuartos", "Semifinal", "Final", "CAMPEÓN 🏆"];
    for (let i = 0; i < knockoutProbs.length; i++) {
      if (knockoutProbs[i] >= 50) bestRound = labels[i + 1] || "CAMPEÓN 🏆";
      else break;
    }
  }

  const chance = qualified
    ? Math.round(
        knockoutProbs.reduce((acc, p) => acc * (p / 100), 1) * 100
      )
    : 0;

  const trophyIdx = Math.min(Math.floor(chance / 17), 5);
  const trophy = TROPHY_EMOJIS[trophyIdx];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#fff",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "0 0 40px",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          background: "linear-gradient(135deg, #003087 0%, #001a4d 60%, #8B0000 100%)",
          padding: "28px 20px 24px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #FCD116 33%, #003087 33%, #003087 66%, #CE1126 66%)",
          }}
        />
        <div style={{ fontSize: 48, marginBottom: 6 }}>🇨🇴</div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            margin: 0,
            letterSpacing: -0.5,
            color: "#FCD116",
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          Colombia al Mundial 2026
        </h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
          Grupo K · Portugal · RD Congo · Uzbekistán
        </p>
      </div>

      {/* SUMMARY BAR */}
      <div
        style={{
          background: qualified ? "rgba(252,209,22,0.12)" : "rgba(255,50,50,0.1)",
          borderBottom: `1px solid ${qualified ? "rgba(252,209,22,0.3)" : "rgba(255,50,50,0.2)"}`,
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>MEJOR RONDA PROYECTADA</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: qualified ? "#FCD116" : "#F44336" }}>
            {bestRound}
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36 }}>{trophy}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>PROB. CAMPEÓN</div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: chance > 20 ? "#00C851" : chance > 5 ? "#FFC107" : "#F44336",
            }}
          >
            {qualified ? `${chance}%` : "—"}
          </div>
        </div>
      </div>

      <div style={{ padding: "0 16px", maxWidth: 540, margin: "0 auto" }}>
        {/* GROUP STAGE */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div
              style={{
                width: 4,
                height: 20,
                borderRadius: 2,
                background: "#FCD116",
              }}
            />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 0.5, color: "#FCD116" }}>
              FASE DE GRUPOS
            </h2>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                padding: "3px 10px",
                borderRadius: 20,
                background: qualified ? "rgba(0,200,80,0.15)" : "rgba(244,67,54,0.15)",
                color: qualified ? "#00C851" : "#F44336",
                fontWeight: 700,
              }}
            >
              {wins >= 2 ? `${wins} victorias → Clasificado ✅` : `${wins} victorias → Eliminado ❌`}
            </span>
          </div>

          {GROUP_MATCHES.map((m, i) => (
            <GroupCard
              key={m.id}
              match={m}
              prob={groupProbs[i]}
              onChange={(v) => updateGroup(i, v)}
            />
          ))}
        </div>

        {/* KNOCKOUT */}
        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div
              style={{ width: 4, height: 20, borderRadius: 2, background: "#CE1126" }}
            />
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, letterSpacing: 0.5, color: "#CE1126" }}>
              RONDAS ELIMINATORIAS
            </h2>
          </div>

          {KNOCKOUT_ROUNDS.map((round, i) => {
            const eliminated = i > 0 && knockoutProbs[i - 1] < 50;
            return (
              <KnockoutCard
                key={round.id}
                round={round}
                prob={knockoutProbs[i]}
                rival={rivals[round.id]}
                onProbChange={(v) => updateKnockout(i, v)}
                onRivalChange={(v) => setRivals((r) => ({ ...r, [round.id]: v }))}
                reached={qualified && !eliminated}
                isEliminated={!qualified || eliminated}
              />
            );
          })}
        </div>

        {/* SCENARIO QUICK-SET */}
        <div
          style={{
            marginTop: 28,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "16px",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#aaa", marginBottom: 12 }}>
            ⚡ ESCENARIOS RÁPIDOS
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {[
              {
                label: "Optimista 🔥",
                gp: [65, 75, 55],
                kp: [80, 65, 55, 50, 45],
              },
              {
                label: "Realista ⚖️",
                gp: [55, 65, 40],
                kp: [70, 55, 45, 40, 35],
              },
              {
                label: "Pesimista 😬",
                gp: [50, 55, 30],
                kp: [60, 45, 35, 30, 25],
              },
              {
                label: "Campeón 🏆",
                gp: [75, 80, 65],
                kp: [85, 75, 65, 60, 55],
              },
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => {
                  setGroupProbs(s.gp);
                  setKnockoutProbs(s.kp);
                }}
                style={{
                  background: "rgba(252,209,22,0.1)",
                  border: "1px solid rgba(252,209,22,0.3)",
                  color: "#FCD116",
                  borderRadius: 8,
                  padding: "7px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  flex: "1 1 auto",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* FOOTER NOTE */}
        <p
          style={{
            fontSize: 11,
            color: "#444",
            textAlign: "center",
            marginTop: 24,
            lineHeight: 1.6,
          }}
        >
          Simulador hipotético · Datos reales Grupo K Mundial 2026
          <br />
          Los rivales en eliminatorias dependen de otros resultados del torneo
        </p>
      </div>
    </div>
  );
}
