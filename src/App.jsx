import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, AreaChart, Area
} from "recharts";

const fmt = (n) => n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n).toLocaleString()}`;

const style = document.createElement("style");
style.textContent = `input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; } input[type=number] { -moz-appearance: textfield; }`;
document.head.appendChild(style);

const dark = {
  bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a", text: "#f1f5f9",
  muted: "#64748b", orange: "#f97316", orangeGlow: "rgba(249,115,22,0.15)",
  green: "#10b981", purple: "#818cf8", red: "#f87171", blue: "#38bdf8",
};

const Tooltip2 = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: dark.border, color: dark.muted, fontSize: 10, fontWeight: 700, cursor: "help" }}
      >?</span>
      {show && (
        <span style={{ position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)", background: "#2d3148", color: dark.text, fontSize: 12, padding: "8px 12px", borderRadius: 8, width: 220, zIndex: 100, border: `1px solid ${dark.border}`, lineHeight: 1.5, pointerEvents: "none", textTransform: "none", letterSpacing: "normal", fontWeight: 400 }}>
          {text}
          <span style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", borderWidth: 5, borderStyle: "solid", borderColor: "#2d3148 transparent transparent transparent" }} />
        </span>
      )}
    </span>
  );
};

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: dark.card, border: `1px solid ${dark.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
      <p style={{ fontWeight: 700, marginBottom: 6, color: dark.text }}>Age {payload[0]?.payload?.age}</p>
      {payload.map((p) => <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>{p.name}: {fmt(p.value)}</p>)}
    </div>
  );
};

function calcYearsToFire(savings, monthlyContrib, fireNumber, realReturn, oneOffExpense = 0, extraAnnual = 0, extraMonthly = 0) {
  const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
  let portfolio = Math.max(0, savings - oneOffExpense);
  let year = 0;
  const netMonthly = monthlyContrib - extraMonthly;
  while (portfolio < fireNumber && year < 60) {
    for (let m = 0; m < 12; m++) portfolio = portfolio * (1 + monthlyReturn) + netMonthly;
    portfolio -= extraAnnual;
    year++;
  }
  return year;
}

function getShareUrl(params) {
  const base = window.location.href.split('?')[0];
  const query = new URLSearchParams(params).toString();
  return `${base}?${query}`;
}

function getParamsFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    age: p.get('age'), savings: p.get('savings'), monthlyContrib: p.get('mc'),
    annualExpenses: p.get('ae'), returnRate: p.get('rr'), inflationRate: p.get('ir'),
    withdrawalRate: p.get('wr'), windfall: p.get('wf'), oneOff: p.get('oo'),
    annualIrregular: p.get('ai'), monthlyIrregular: p.get('mi'),
  };
}

export default function App() {
  const url = getParamsFromUrl();
  const [age, setAge] = useState(Number(url.age) || 27);
  const [savings, setSavings] = useState(Number(url.savings) || 20000);
  const [monthlyContrib, setMonthlyContrib] = useState(Number(url.monthlyContrib) || 2000);
  const [annualExpenses, setAnnualExpenses] = useState(Number(url.annualExpenses) || 50000);
  const [returnRate, setReturnRate] = useState(Number(url.returnRate) || 7);
  const [inflationRate, setInflationRate] = useState(Number(url.inflationRate) || 3);
  const [withdrawalRate, setWithdrawalRate] = useState(Number(url.withdrawalRate) || 4);
  const [windfall, setWindfall] = useState(url.windfall ? Number(url.windfall) : "");
  const [oneOff, setOneOff] = useState(url.oneOff ? Number(url.oneOff) : "");
  const [annualIrregular, setAnnualIrregular] = useState(url.annualIrregular ? Number(url.annualIrregular) : "");
  const [monthlyIrregular, setMonthlyIrregular] = useState(url.monthlyIrregular ? Number(url.monthlyIrregular) : "");
  const [submitted, setSubmitted] = useState(!!url.age);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const windfallVal = Number(windfall) || 0;
    const oneOffVal = Number(oneOff) || 0;
    const annualIrregularVal = Number(annualIrregular) || 0;
    const monthlyIrregularVal = Number(monthlyIrregular) || 0;

    const fireNumber = annualExpenses / (withdrawalRate / 100);
    const realReturn = (1 + returnRate / 100) / (1 + inflationRate / 100) - 1;
    const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
    const cMonthlyReturn = Math.pow(1 + Math.max(0, realReturn - 0.01), 1 / 12) - 1;
    const aMonthlyReturn = Math.pow(1 + realReturn + 0.01, 1 / 12) - 1;

    const baseYears = calcYearsToFire(savings + windfallVal, monthlyContrib, fireNumber, realReturn);
    const withExpensesYears = calcYearsToFire(savings + windfallVal, monthlyContrib, fireNumber, realReturn, oneOffVal, annualIrregularVal, monthlyIrregularVal);
    const impactYears = withExpensesYears - baseYears;

    let portfolio = savings + windfallVal, cPort = savings + windfallVal, aPort = savings + windfallVal;
    let adjPort = Math.max(0, savings + windfallVal - oneOffVal);
    let totalContributed = savings + windfallVal, year = 0;
    const chartData = [], breakdownData = [];
    const maxYears = Math.max(withExpensesYears, baseYears) + 1;

    while (year < maxYears && year < 60) {
      chartData.push({ year, age: age + year, portfolio: Math.round(portfolio), conservative: Math.round(cPort), aggressive: Math.round(aPort), adjusted: Math.round(adjPort), fireNumber: Math.round(fireNumber) });
      breakdownData.push({ year, age: age + year, contributions: Math.round(totalContributed), growth: Math.max(0, Math.round(portfolio - totalContributed)) });
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlyContrib;
        cPort = cPort * (1 + cMonthlyReturn) + monthlyContrib;
        aPort = aPort * (1 + aMonthlyReturn) + monthlyContrib;
        adjPort = adjPort * (1 + monthlyReturn) + (monthlyContrib - monthlyIrregularVal);
        totalContributed += monthlyContrib;
      }
      adjPort -= annualIrregularVal;
      year++;
    }
    chartData.push({ year, age: age + year, portfolio: Math.round(portfolio), conservative: Math.round(cPort), aggressive: Math.round(aPort), adjusted: Math.round(adjPort), fireNumber: Math.round(fireNumber) });
    breakdownData.push({ year, age: age + year, contributions: Math.round(totalContributed), growth: Math.max(0, Math.round(portfolio - totalContributed)) });

    return { fireNumber, yearsToFire: baseYears, fireAge: age + baseYears, withExpensesYears, withExpensesAge: age + withExpensesYears, impactYears, chartData, breakdownData };
  }, [age, savings, monthlyContrib, annualExpenses, returnRate, inflationRate, withdrawalRate, windfall, oneOff, annualIrregular, monthlyIrregular]);

  const handleShare = () => {
    const u = getShareUrl({ age, savings, mc: monthlyContrib, ae: annualExpenses, rr: returnRate, ir: inflationRate, wr: withdrawalRate, wf: windfall, oo: oneOff, ai: annualIrregular, mi: monthlyIrregular });
    navigator.clipboard.writeText(u);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputBase = { width: "100%", padding: "10px 12px", borderRadius: 8, border: `1.5px solid ${dark.border}`, fontSize: 15, outline: "none", boxSizing: "border-box", background: "#0f1117", color: dark.text, MozAppearance: "textfield", WebkitAppearance: "none" };

  const hasIrregulars = Number(windfall) > 0 || Number(oneOff) > 0 || Number(annualIrregular) > 0 || Number(monthlyIrregular) > 0;

  const fields = [
    { label: "Current Age", tooltip: "Your age today. This determines how many years you have to reach FIRE.", value: age, set: setAge, suffix: "yrs", min: 18, max: 70 },
    { label: "Current Savings", tooltip: "Total investable assets you have right now — e.g. 401k, index funds, brokerage accounts. Don't include your home value.", value: savings, set: setSavings, prefix: "$", min: 0, max: 5000000, step: 1000 },
    { label: "Monthly Contribution", tooltip: "How much you invest every month on top of your current savings. Include employer 401k match if applicable.", value: monthlyContrib, set: setMonthlyContrib, prefix: "$", suffix: "/mo", min: 0, max: 50000, step: 100 },
    { label: "Annual Expenses (Retirement)", tooltip: "How much you plan to spend per year in retirement, in today's dollars. This is the most important number — it directly sets your FIRE target.", value: annualExpenses, set: setAnnualExpenses, prefix: "$", suffix: "/yr", min: 10000, max: 500000, step: 1000 },
    { label: "Expected Annual Return", tooltip: "The average yearly return on your investments before inflation. The S&P 500 has historically returned ~10% annually. 7% is a conservative estimate.", value: returnRate, set: setReturnRate, suffix: "%", min: 1, max: 15, step: 0.5 },
    { label: "Inflation Rate", tooltip: "The average annual rise in prices. Historically ~3% in the US. This reduces the real value of your returns over time.", value: inflationRate, set: setInflationRate, suffix: "%", min: 0, max: 10, step: 0.5 },
    { label: "Safe Withdrawal Rate", tooltip: "The % of your portfolio you withdraw each year in retirement. The classic 4% rule means your money should last 30+ years. Lower = more conservative.", value: withdrawalRate, set: setWithdrawalRate, suffix: "%", min: 2, max: 6, step: 0.5 },
  ];

  const irregularFields = [
    { label: "Expected Windfall / Inheritance", tooltip: "A one-time lump sum you expect to receive, like an inheritance or bonus. This is added directly to your savings today.", value: windfall, set: setWindfall, prefix: "$", step: 1000 },
    { label: "One-off Big Expense", tooltip: "A large one-time cost like a wedding, car, or house deposit. This is deducted from your portfolio once immediately.", value: oneOff, set: setOneOff, prefix: "$", step: 1000 },
    { label: "Annual Irregular Expenses", tooltip: "Costs that happen once a year but aren't in your regular budget — e.g. holidays, home repairs, insurance. These reduce your portfolio each year.", value: annualIrregular, set: setAnnualIrregular, prefix: "$", suffix: "/yr", step: 500 },
    { label: "Monthly Irregular Expenses", tooltip: "Extra monthly costs outside your core budget — e.g. dining out, subscriptions, hobbies. These reduce your monthly contributions.", value: monthlyIrregular, set: setMonthlyIrregular, prefix: "$", suffix: "/mo", step: 100 },
  ];

  const milestones = [
    { label: "25x (Lean FIRE)", value: annualExpenses * 25, color: dark.blue },
    { label: "50x (Fat FIRE)", value: annualExpenses * 50, color: dark.purple },
  ];

  return (
    <div style={{ minHeight: "100vh", background: dark.bg, fontFamily: "'Inter', sans-serif", color: dark.text }}>
      <div style={{ background: dark.card, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: dark.orange, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔥</div>
        <span style={{ fontWeight: 800, fontSize: 18 }}>FIRE Calculus</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: dark.muted }}>Free · No sign-up · No data stored</span>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>
            When can you <span style={{ color: dark.orange }}>retire early?</span>
          </h1>
          <p style={{ color: dark.muted, marginTop: 10, fontSize: 16 }}>Enter your numbers and get your FIRE date instantly.</p>
        </div>

        <div style={{ background: dark.card, borderRadius: 16, padding: 28, border: `1px solid ${dark.border}`, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 14, color: dark.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Core Details</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {fields.map(({ label, tooltip, value, set, prefix, suffix, min, max, step = 1 }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: dark.muted, display: "flex", alignItems: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {label}<Tooltip2 text={tooltip} />
                </label>
                <div style={{ position: "relative" }}>
                  {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 15 }}>{prefix}</span>}
                  <input type="number" value={value} min={min} max={max} step={step} onChange={(e) => set(Number(e.target.value))} style={{ ...inputBase, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 40 : 12 }} />
                  {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 13 }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: dark.card, borderRadius: 16, padding: 28, border: `1px solid ${dark.border}`, marginBottom: 28 }}>
          <h3 style={{ margin: "0 0 4px", fontSize: 14, color: dark.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>Irregular Expenses & Windfalls</h3>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: dark.muted }}>See how these impact your FIRE date separately</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
            {irregularFields.map(({ label, tooltip, value, set, prefix, suffix, step }) => (
              <div key={label}>
                <label style={{ fontSize: 12, fontWeight: 600, color: dark.muted, display: "flex", alignItems: "center", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {label}<Tooltip2 text={tooltip} />
                </label>
                <div style={{ position: "relative" }}>
                  {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 15 }}>{prefix}</span>}
                  <input type="number" value={value} placeholder="0" min={0} step={step} onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))} style={{ ...inputBase, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 40 : 12 }} />
                  {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 13 }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setSubmitted(true)} style={{ width: "100%", padding: 14, background: dark.orange, color: "#fff", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: `0 0 24px rgba(249,115,22,0.4)`, marginBottom: 28 }}>
          Calculate My FIRE Date →
        </button>

        {submitted && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
              {[
                { label: "FIRE Date", value: `Age ${result.fireAge}`, sub: `In ${result.yearsToFire} years`, color: dark.orange },
                { label: "FIRE Number", value: fmt(result.fireNumber), sub: "Portfolio needed", color: dark.green },
                { label: "Years to FIRE", value: `${result.yearsToFire} yrs`, sub: result.yearsToFire < 20 ? "🔥 Retiring early!" : "On track", color: dark.purple },
                { label: "Monthly Budget", value: fmt(annualExpenses / 12), sub: "In today's dollars", color: dark.blue },
              ].map(({ label, value, sub, color }) => (
                <div key={label} style={{ background: dark.card, borderRadius: 14, padding: "20px 18px", border: `1px solid ${dark.border}`, borderTop: `3px solid ${color}` }}>
                  <p style={{ fontSize: 11, color: dark.muted, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: 0.6 }}>{label}</p>
                  <p style={{ fontSize: 24, fontWeight: 800, color, margin: "8px 0 4px" }}>{value}</p>
                  <p style={{ fontSize: 13, color: dark.muted, margin: 0 }}>{sub}</p>
                </div>
              ))}
            </div>

            {hasIrregulars && (
              <div style={{ background: dark.card, borderRadius: 14, padding: "20px 24px", border: `1px solid ${dark.border}`, borderLeft: `4px solid ${result.impactYears > 0 ? dark.red : dark.green}`, marginBottom: 16 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: dark.text, margin: "0 0 12px" }}>💸 Impact of Irregular Expenses & Windfalls</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                  <div>
                    <p style={{ fontSize: 11, color: dark.muted, margin: "0 0 4px", textTransform: "uppercase" }}>Without Irregulars</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: dark.green, margin: 0 }}>Age {result.fireAge}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: dark.muted, margin: "0 0 4px", textTransform: "uppercase" }}>With Irregulars</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: result.impactYears > 0 ? dark.red : dark.green, margin: 0 }}>Age {result.withExpensesAge}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: dark.muted, margin: "0 0 4px", textTransform: "uppercase" }}>Impact</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: result.impactYears > 0 ? dark.red : dark.green, margin: 0 }}>
                      {result.impactYears > 0 ? `+${result.impactYears} yrs later` : result.impactYears < 0 ? `${Math.abs(result.impactYears)} yrs earlier 🎉` : "No impact"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleShare} style={{ padding: "10px 20px", background: copied ? dark.green : dark.card, color: copied ? "#fff" : dark.text, border: `1px solid ${copied ? dark.green : dark.border}`, borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                {copied ? "✅ Link Copied!" : "🔗 Share My Results"}
              </button>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 4px 16px", fontWeight: 700, fontSize: 16 }}>📈 Portfolio Growth</h3>
              <p style={{ margin: "0 0 20px 16px", fontSize: 13, color: dark.muted }}>Base, conservative & aggressive scenarios with FIRE milestones</p>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={result.chartData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="age" stroke={dark.muted} tick={{ fontSize: 12, fill: dark.muted }} label={{ value: "Age", position: "insideBottom", offset: -10, fill: dark.muted, fontSize: 12 }} />
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65} tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16, color: dark.muted }} />
                  {milestones.map(m => <ReferenceLine key={m.label} y={m.value} stroke={m.color} strokeDasharray="5 3" label={{ value: m.label, fill: m.color, fontSize: 11, position: "insideTopRight" }} />)}
                  <ReferenceLine y={result.fireNumber} stroke={dark.orange} strokeDasharray="6 3" strokeWidth={2} label={{ value: `FIRE: ${fmt(result.fireNumber)}`, fill: dark.orange, fontSize: 11, position: "insideTopRight" }} />
                  <Line type="monotone" dataKey="aggressive" name="Aggressive" stroke={dark.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="portfolio" name="Base Case" stroke={dark.orange} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="conservative" name="Conservative" stroke={dark.red} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  {hasIrregulars && <Line type="monotone" dataKey="adjusted" name="With Irregulars" stroke={dark.blue} strokeWidth={2} dot={false} strokeDasharray="6 3" />}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}` }}>
              <h3 style={{ margin: "0 0 4px 16px", fontWeight: 700, fontSize: 16 }}>💰 Contributions vs. Investment Growth</h3>
              <p style={{ margin: "0 0 20px 16px", fontSize: 13, color: dark.muted }}>See how much of your wealth comes from saving vs. the market</p>
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
                  <XAxis dataKey="age" stroke={dark.muted} tick={{ fontSize: 12, fill: dark.muted }} label={{ value: "Age", position: "insideBottom", offset: -10, fill: dark.muted, fontSize: 12 }} />
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65} tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
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
