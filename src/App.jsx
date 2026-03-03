import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, AreaChart, Area
} from "recharts";

const fmt = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n).toLocaleString()}`;

const dark = {
  bg: "#0f1117",
  card: "#1a1d27",
  border: "#2a2d3a",
  text: "#f1f5f9",
  muted: "#64748b",
  orange: "#f97316",
  orangeGlow: "rgba(249,115,22,0.15)",
  green: "#10b981",
  purple: "#818cf8",
  red: "#f87171",
  blue: "#38bdf8",
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: dark.text }}>Age {payload[0]?.payload?.age}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

const BreakdownTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: dark.text }}>Age {payload[0]?.payload?.age}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>{p.name}: {fmt(p.value)}</p>
      ))}
    </div>
  );
};

export default function App() {
  const [age, setAge] = useState(27);
  const [savings, setSavings] = useState(20000);
  const [monthlyContrib, setMonthlyContrib] = useState(2000);
  const [annualExpenses, setAnnualExpenses] = useState(50000);
  const [returnRate, setReturnRate] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [submitted, setSubmitted] = useState(false);

  const result = useMemo(() => {
    const fireNumber = annualExpenses / (withdrawalRate / 100);
    const realReturn = (1 + returnRate / 100) / (1 + inflationRate / 100) - 1;
    const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
    const cMonthlyReturn = Math.pow(1 + Math.max(0, realReturn - 0.01), 1 / 12) - 1;
    const aMonthlyReturn = Math.pow(1 + realReturn + 0.01, 1 / 12) - 1;

    let portfolio = savings, cPort = savings, aPort = savings;
    let totalContributed = savings, year = 0;
    const chartData = [], breakdownData = [];

    while (portfolio < fireNumber && year < 60) {
      const investmentGrowth = portfolio - totalContributed;
      chartData.push({
        year, age: age + year,
        portfolio: Math.round(portfolio),
        conservative: Math.round(cPort),
        aggressive: Math.round(aPort),
        fireNumber: Math.round(fireNumber),
      });
      breakdownData.push({
        year, age: age + year,
        contributions: Math.round(totalContributed),
        growth: Math.max(0, Math.round(investmentGrowth)),
      });

      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlyContrib;
        cPort = cPort * (1 + cMonthlyReturn) + monthlyContrib;
        aPort = aPort * (1 + aMonthlyReturn) + monthlyContrib;
        totalContributed += monthlyContrib;
      }
      year++;
    }
    chartData.push({ year, age: age + year, portfolio: Math.round(portfolio), conservative: Math.round(cPort), aggressive: Math.round(aPort), fireNumber: Math.round(fireNumber) });
    breakdownData.push({ year, age: age + year, contributions: Math.round(totalContributed), growth: Math.max(0, Math.round(portfolio - totalContributed)) });

    return { fireNumber, yearsToFire: year, fireAge: age + year, chartData, breakdownData };
  }, [age, savings, monthlyContrib, annualExpenses, returnRate, inflationRate, withdrawalRate]);

  const milestones = [
    { label: "25x (Lean FIRE)", value: annualExpenses * 25, color: dark.blue },
    { label: "50x (Fat FIRE)", value: annualExpenses * 50, color: dark.purple },
  ];

  const fields = [
    { label: "Current Age", value: age, set: setAge, prefix: "", suffix: "yrs", min: 18, max: 70 },
    { label: "Current Savings", value: savings, set: setSavings, prefix: "$", suffix: "", min: 0, max: 5000000, step: 1000 },
    { label: "Monthly Contribution", value: monthlyContrib, set: setMonthlyContrib, prefix: "$", suffix: "/mo", min: 0, max: 50000, step: 100 },
    { label: "Annual Expenses (Retirement)", value: annualExpenses, set: setAnnualExpenses, prefix: "$", suffix: "/yr", min: 10000, max: 500000, step: 1000 },
    { label: "Expected Annual Return", value: returnRate, set: setReturnRate, prefix: "", suffix: "%", min: 1, max: 15, step: 0.5 },
    { label: "Inflation Rate", value: inflationRate, set: setInflationRate, prefix: "", suffix: "%", min: 0, max: 10, step: 0.5 },
    { label: "Safe Withdrawal Rate", value: withdrawalRate, set: setWithdrawalRate, prefix: "", suffix: "%", min: 2, max: 6, step: 0.5 },
  ];

  const cards = [
    { label: "FIRE Date", value: `Age ${result.fireAge}`, sub: `In ${result.yearsToFire} years`, color: dark.orange },
    { label: "FIRE Number", value: fmt(result.fireNumber), sub: "Portfolio needed", color: dark.green },
    { label: "Years to FIRE", value: `${result.yearsToFire} yrs`, sub: result.yearsToFire < 20 ? "🔥 Retiring early!" : "On track", color: dark.purple },
    { label: "Monthly Budget", value: fmt(annualExpenses / 12), sub: "In today's dollars", color: dark.blue },
  ];

  const inputBase = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1.5px solid ${dark.border}`, fontSize: 15, outline: "none",
    boxSizing: "border-box", background: "#0f1117", color: dark.text,
  };

  return (
    <div style={{ minHeight: "100vh", background: dark.bg, fontFamily: "'Inter', sans-serif", color: dark.text }}>
      {/* Header */}
      <div style={{ background: dark.card, borderBottom: `1px solid ${dark.border}`, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: dark.orange, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: `0 0 12px ${dark.orangeGlow}` }}>🔥</div>
        <span style={{ fontWeight: 800, fontSize: 18 }}>FIRE Calculus</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: dark.muted }}>Free · No sign-up · No data stored</span>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px" }}>
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            When can you <span style={{ color: dark.orange, textShadow: `0 0 30px ${dark.orangeGlow}` }}>retire early?</span>
          </h1>
          <p style={{ color: dark.muted, marginTop: 10, fontSize: 16 }}>
            Enter your numbers and get your FIRE date instantly.
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: dark.card, borderRadius: 16, padding: 28, border: `1px solid ${dark.border}`, marginBottom: 28, boxShadow: `0 0 40px rgba(0,0,0,0.4)` }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {fields.map(({ label, value, set, prefix, suffix, min, max, step = 1 }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: dark.muted, display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {label}
                </label>
                <div style={{ position: "relative" }}>
                  {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 15 }}>{prefix}</span>}
                  <input
                    type="number" value={value} min={min} max={max} step={step}
                    onChange={(e) => set(Number(e.target.value))}
                    style={{ ...inputBase, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 36 : 12 }}
                  />
                  {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 13 }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSubmitted(true)}
            style={{
              marginTop: 24, width: "100%", padding: 14,
              background: dark.orange, color: "#fff", fontWeight: 700,
              fontSize: 16, border: "none", borderRadius: 10, cursor: "pointer",
              boxShadow: `0 0 24px rgba(249,115,22,0.4)`,
            }}
          >
            Calculate My FIRE Date →
          </button>
        </div>

        {/* Results */}
        {submitted && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
              {cards.map(({ label, value, sub, color }) => (
                <div key={label} style={{
                  background: dark.card, borderRadius: 14, padding: "20px 18px",
                  border: `1px solid ${dark.border}`, borderTop: `3px solid ${color}`,
                  boxShadow: `0 0 20px rgba(0,0,0,0.3)`,
                }}>
                  <p style={{ fontSize: 11, color: dark.muted, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color, margin: "8px 0 4px", textShadow: `0 0 20px ${color}44` }}>{value}</p>
                  <p style={{ fontSize: 13, color: dark.muted, margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}`, marginBottom: 20, boxShadow: `0 0 40px rgba(0,0,0,0.3)` }}>
              <h3 style={{ margin: "0 0 4px 16px", fontWeight: 700, fontSize: 16 }}>📈 Portfolio Growth</h3>
              <p style={{ margin: "0 0 20px 16px", fontSize: 13, color: dark.muted }}>Base, conservative & aggressive scenarios with FIRE milestones</p>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={result.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="age" stroke={dark.muted} tick={{ fontSize: 12, fill: dark.muted }}
                    label={{ value: "Age", position: "insideBottom", offset: -10, fill: dark.muted, fontSize: 12 }} />
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65}
                    tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16, color: dark.muted }} />
                  {milestones.map(m => (
                    <ReferenceLine key={m.label} y={m.value} stroke={m.color} strokeDasharray="5 3"
                      label={{ value: m.label, fill: m.color, fontSize: 11, position: "insideTopRight" }} />
                  ))}
                  <ReferenceLine y={result.fireNumber} stroke={dark.orange} strokeDasharray="6 3" strokeWidth={2}
                    label={{ value: `FIRE: ${fmt(result.fireNumber)}`, fill: dark.orange, fontSize: 11, position: "insideTopRight" }} />
                  <Line type="monotone" dataKey="aggressive" name="Aggressive" stroke={dark.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="portfolio" name="Base Case" stroke={dark.orange} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="conservative" name="Conservative" stroke={dark.red} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}`, boxShadow: `0 0 40px rgba(0,0,0,0.3)` }}>
              <h3 style={{ margin: "0 0 4px 16px", fontWeight: 700, fontSize: 16 }}>💰 Contributions vs. Investment Growth</h3>
              <p style={{ margin: "0 0 20px 16px", fontSize: 13, color: dark.muted }}>See how much of your wealth is earned by the market vs. your savings</p>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={result.breakdownData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <defs>
                    <linearGradient id="gContrib" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dark.purple} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={dark.purple} stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="gGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={dark.green} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={dark.green} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="age" stroke={dark.muted} tick={{ fontSize: 12, fill: dark.muted }}
                    label={{ value: "Age", position: "insideBottom", offset: -10, fill: dark.muted, fontSize: 12 }} />
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65}
                    tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<BreakdownTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16, color: dark.muted }} />
                  <Area type="monotone" dataKey="contributions" name="Your Contributions" stroke={dark.purple} fill="url(#gContrib)" strokeWidth={2} />
                  <Area type="monotone" dataKey="growth" name="Market Growth" stroke={dark.green} fill="url(#gGrowth)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 20, textAlign: "center", color: dark.muted, fontSize: 13 }}>
              💡 Share this with a friend thinking about FIRE — it's free and takes 30 seconds.
            </div>
          </>
        )}
      </div>
    </div>
  );
}

