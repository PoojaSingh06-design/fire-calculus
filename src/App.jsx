import { useState, useMemo, useEffect, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer, AreaChart, Area
} from "recharts";

// ── Google Analytics GA4 ──────────────────────────────────────────
const GA_ID = "G-SG1DVPQE9L";

function loadGA() {
  if (document.getElementById("ga-script")) return;
  const s = document.createElement("script");
  s.id = "ga-script";
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, { send_page_view: true });
}

function trackEvent(eventName, params = {}) {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }
}
// ─────────────────────────────────────────────────────────────────

// ── Country / Currency Config ─────────────────────────────────────
const COUNTRIES = {
  US: {
    flag: "🇺🇸", name: "United States", currency: "$", code: "USD",
    tooltips: { savings: "Total investable assets — e.g. 401(k), Roth IRA, brokerage accounts. Don't include your home value.", monthlyContrib: "How much you invest monthly. Include your employer 401(k) match if applicable.", annualExpenses: "Planned annual spending in retirement in today's dollars. This is the most important number — it sets your FIRE target.", returnRate: "S&P 500 has historically returned ~10%/yr. 7% is a conservative post-fee estimate.", inflationRate: "US inflation has averaged ~3%. Higher inflation erodes real returns.", withdrawalRate: "The 4% rule (from US data) means your portfolio should last 30+ years. Go lower for more safety.", statePension: "Expected annual Social Security income. Check your estimate at ssa.gov. Reduces your required FIRE portfolio.", taxRate: "401(k)/IRA withdrawals taxed as income. Roth IRA is tax-free (enter 0%). Typical effective rate: 10–22%." },
    defaults: { annualExpenses: 50000, returnRate: 7, inflationRate: 3, withdrawalRate: 4, monthlyContrib: 1500, savings: 25000 },
    tips: [
      "Max out your 401(k) — 2024 limit is $23,000 (+$7,500 catch-up over 50)",
      "HSA triple tax advantage: contribute $4,150 (individual) or $8,300 (family) in 2024",
      "Roth IRA limit is $7,000/yr — ideal for tax-free retirement withdrawals",
      "The 4% rule is based on US market data — a safe starting point for most",
    ],
  },
  UK: {
    flag: "🇬🇧", name: "United Kingdom", currency: "£", code: "GBP",
    tooltips: { savings: "Total investable assets — e.g. Stocks & Shares ISA, SIPP, GIA. Don't include your home value.", monthlyContrib: "How much you invest monthly. Include employer pension contributions if applicable.", annualExpenses: "Planned annual spending in retirement in today's pounds. This directly sets your FIRE target.", returnRate: "UK/global equity funds have historically returned ~7–8%/yr. 6.5% is a conservative post-fee estimate.", inflationRate: "UK CPI has averaged ~3% historically. Higher inflation reduces your real returns.", withdrawalRate: "3.5% is safer for UK investors — the 4% rule is based on US market data.", statePension: "UK State Pension is ~£11,500/yr (full amount). Check your forecast at gov.uk/check-state-pension.", taxRate: "25% of pension is tax-free. Rest taxed as income — basic rate taxpayers pay 20%. Enter your expected effective rate." },
    defaults: { annualExpenses: 30000, returnRate: 6.5, inflationRate: 3, withdrawalRate: 3.5, monthlyContrib: 1000, savings: 20000 },
    tips: [
      "ISA allowance is £20,000/yr — use it fully for tax-free growth",
      "SIPP (Self-Invested Personal Pension) gives 20–45% tax relief on contributions",
      "State Pension is ~£11,500/yr — factor this into your withdrawal needs",
      "Bed & ISA: transfer existing investments into an ISA to shelter future gains",
    ],
  },
  IN: {
    flag: "🇮🇳", name: "India", currency: "₹", code: "INR",
    tooltips: { savings: "Total investable assets — e.g. mutual funds, PPF, NPS, stocks, FDs. Don't include property value.", monthlyContrib: "Monthly investments across all instruments — SIPs, PPF, NPS, direct equity etc.", annualExpenses: "Planned annual spending in retirement in today's rupees. This directly sets your FIRE target.", returnRate: "Nifty 50 has historically returned ~12%/yr. 10% is a conservative post-fee estimate.", inflationRate: "Indian inflation has averaged ~6%. This significantly reduces real returns — plan conservatively.", withdrawalRate: "3.5% is recommended for India given higher inflation and sequence-of-returns risk.", statePension: "Expected NPS annuity or EPF pension income per year. Enter 0 if you have no government pension.", taxRate: "Equity LTCG above ₹1L taxed at 10%. Debt fund gains taxed per income slab. Enter your expected effective rate." },
    defaults: { annualExpenses: 600000, returnRate: 10, inflationRate: 6, withdrawalRate: 3.5, monthlyContrib: 30000, savings: 500000 },
    tips: [
      "PPF (Public Provident Fund) offers tax-free returns at ~7.1% — max ₹1.5L/yr",
      "NPS (National Pension System) gives extra ₹50,000 deduction under 80CCD(1B)",
      "ELSS mutual funds offer 3-year lock-in with Section 80C tax deduction",
      "India's higher inflation (~6%) means real returns are lower — plan conservatively",
    ],
  },
  AU: {
    flag: "🇦🇺", name: "Australia", currency: "A$", code: "AUD",
    tooltips: { savings: "Total investable assets — e.g. Super balance, shares, ETFs. Don't include your home value.", monthlyContrib: "Monthly investments including voluntary super contributions and personal investments.", annualExpenses: "Planned annual spending in retirement in today's Australian dollars. This sets your FIRE target.", returnRate: "Australian super funds have historically returned ~7–8%/yr. 7% is a reasonable post-fee estimate.", inflationRate: "Australian CPI has averaged ~3% historically. This reduces real returns over time.", withdrawalRate: "4% is reasonable for Australian retirees. Age Pension and Super drawdown rules may also affect your strategy.", statePension: "Age Pension provides up to ~A$27,000/yr (singles). Subject to assets & income tests — check servicesaustralia.gov.au.", taxRate: "Super withdrawals after age 60 are tax-free — enter 0%. Before 60, a 15% tax may apply on the taxable component." },
    defaults: { annualExpenses: 55000, returnRate: 7, inflationRate: 3, withdrawalRate: 4, monthlyContrib: 2000, savings: 40000 },
    tips: [
      "Superannuation is compulsory at 11% of salary — check your balance regularly",
      "Concessional (pre-tax) super contributions capped at $27,500/yr",
      "Non-concessional (after-tax) super contributions capped at $110,000/yr",
      "You can access super at preservation age (60) tax-free after retirement",
    ],
  },
  CA: {
    flag: "🇨🇦", name: "Canada", currency: "C$", code: "CAD",
    tooltips: { savings: "Total investable assets — e.g. TFSA, RRSP, non-registered accounts. Don't include your home value.", monthlyContrib: "Monthly investments. Include employer RRSP matching if applicable.", annualExpenses: "Planned annual spending in retirement in today's Canadian dollars. This sets your FIRE target.", returnRate: "Canadian and global equity funds have historically returned ~7–8%/yr. 6.5% is a conservative estimate.", inflationRate: "Canadian CPI has averaged ~3% historically. Higher inflation reduces real returns.", withdrawalRate: "4% is a reasonable start. CPP and OAS provide income that reduces how much you need to withdraw.", statePension: "CPP + OAS can provide ~C$18,000–22,000/yr. Check your estimate at My Service Canada.", taxRate: "TFSA withdrawals are tax-free (enter 0%). RRSP/RRIF withdrawals taxed as income — typical effective rate: 15–25%." },
    defaults: { annualExpenses: 50000, returnRate: 6.5, inflationRate: 3, withdrawalRate: 4, monthlyContrib: 1500, savings: 30000 },
    tips: [
      "TFSA (Tax-Free Savings Account) — 2024 contribution room is $7,000",
      "RRSP limit is 18% of prior year income, up to $31,560 for 2024",
      "CPP & OAS provide a base income in retirement — factor this into your plan",
      "FHSA: first home buyers can contribute $8,000/yr tax-free toward a home purchase",
    ],
  },
  EU: {
    flag: "🇪🇺", name: "Europe", currency: "€", code: "EUR",
    tooltips: { savings: "Total investable assets — e.g. brokerage accounts, ETFs, pension funds. Don't include your home value.", monthlyContrib: "Monthly investments across all instruments — ETFs, pension contributions, savings plans etc.", annualExpenses: "Planned annual spending in retirement in today's euros. This directly sets your FIRE target.", returnRate: "European and global equity funds have historically returned ~6–7%/yr. 6% is a conservative post-fee estimate.", inflationRate: "Eurozone inflation has averaged ~3% but has been volatile recently. Adjust based on your country.", withdrawalRate: "3.5% recommended for European investors — the 4% rule was based on US data and may be too optimistic.", statePension: "Most EU countries have generous state pensions. Enter your expected annual amount to reduce your FIRE number.", taxRate: "Capital gains tax varies — e.g. 26.375% in Germany, 30% in France, 26% in Italy. Enter your country's effective rate." },
    defaults: { annualExpenses: 28000, returnRate: 6, inflationRate: 3, withdrawalRate: 3.5, monthlyContrib: 900, savings: 15000 },
    tips: [
      "Tax rules vary widely by country — check your local pension and ISA equivalents",
      "Low-cost ETFs (e.g. VWCE) are the most popular FIRE vehicle across Europe",
      "Many EU countries have generous state pensions — factor these into your plan",
      "Geo-arbitrage within the EU (e.g. moving to Portugal or Spain) can reduce costs significantly",
    ],
  },
};

const DEFAULT_COUNTRY = "US";

function fmtCurrency(n, symbol) {
  if (n >= 1e6) return `${symbol}${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${symbol}${Math.round(n).toLocaleString()}`;
  return `${symbol}${Math.round(n)}`;
}
// Global fmt used by components outside App — sym is injected via context
let _globalSym = "$";
const fmt = (n) => fmtCurrency(n, _globalSym);
// ─────────────────────────────────────────────────────────────────


const dark = {
  bg: "#0f1117", card: "#1a1d27", border: "#2a2d3a", text: "#f1f5f9",
  muted: "#64748b", orange: "#f97316", green: "#10b981", purple: "#818cf8",
  red: "#f87171", blue: "#38bdf8",
};

const Tooltip2 = ({ text }) => {
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: "relative", display: "inline-block", marginLeft: 6 }}>
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 16, height: 16, borderRadius: "50%", background: dark.border, color: dark.muted, fontSize: 10, fontWeight: 700, cursor: "help" }}>?</span>
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

function calcRequiredMonthlySavings(savings, fireNumber, realReturn, targetYears) {
  const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
  if (monthlyReturn === 0) return (fireNumber - savings) / (targetYears * 12);
  const n = targetYears * 12;
  const fv = fireNumber - savings * Math.pow(1 + monthlyReturn, n);
  return fv * monthlyReturn / (Math.pow(1 + monthlyReturn, n) - 1);
}

function calcRequiredExpenses(savings, monthlyContrib, realReturn, targetYears, withdrawalRate) {
  const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
  let portfolio = savings;
  for (let m = 0; m < targetYears * 12; m++) portfolio = portfolio * (1 + monthlyReturn) + monthlyContrib;
  return portfolio * withdrawalRate;
}

function getParamsFromUrl() {
  const p = new URLSearchParams(window.location.search);
  return {
    age: p.get("age"), savings: p.get("savings"), monthlyContrib: p.get("mc"), country: p.get("country"), statePension: p.get("sp"), taxRate: p.get("tr"),
    annualExpenses: p.get("ae"), returnRate: p.get("rr"), inflationRate: p.get("ir"),
    withdrawalRate: p.get("wr"), windfall: p.get("wf"), oneOff: p.get("oo"),
    annualIrregular: p.get("ai"), monthlyIrregular: p.get("mi"),
  };
}

function buildShareUrl(vals) {
  const base = window.location.href.split("?")[0];
  const p = new URLSearchParams({
    age: vals.age, savings: vals.savings, mc: vals.monthlyContrib, country: vals.country,
    ae: vals.annualExpenses, rr: vals.returnRate, ir: vals.inflationRate,
    wr: vals.withdrawalRate, wf: vals.windfall || 0, oo: vals.oneOff || 0,
    ai: vals.annualIrregular || 0, mi: vals.monthlyIrregular || 0, sp: vals.statePension || 0, tr: vals.taxRate || 0,
  });
  return `${base}?${p.toString()}`;
}

export default function App() {
  const url = getParamsFromUrl();
  const [age, setAge] = useState(url.age ? Number(url.age) : "");
  const [savings, setSavings] = useState(url.savings ? Number(url.savings) : "");
  const [monthlyContrib, setMonthlyContrib] = useState(url.monthlyContrib ? Number(url.monthlyContrib) : "");
  const [annualExpenses, setAnnualExpenses] = useState(url.annualExpenses ? Number(url.annualExpenses) : "");
  const [returnRate, setReturnRate] = useState(url.returnRate ? Number(url.returnRate) : "");
  const [inflationRate, setInflationRate] = useState(url.inflationRate ? Number(url.inflationRate) : "");
  const [withdrawalRate, setWithdrawalRate] = useState(url.withdrawalRate ? Number(url.withdrawalRate) : "");
  const [windfall, setWindfall] = useState(url.windfall ? Number(url.windfall) : "");
  const [oneOff, setOneOff] = useState(url.oneOff ? Number(url.oneOff) : "");
  const [annualIrregular, setAnnualIrregular] = useState(url.annualIrregular ? Number(url.annualIrregular) : "");
  const [monthlyIrregular, setMonthlyIrregular] = useState(url.monthlyIrregular ? Number(url.monthlyIrregular) : "");
  const [statePension, setStatePension] = useState(url.statePension ? Number(url.statePension) : "");
  const [taxRate, setTaxRate] = useState(url.taxRate ? Number(url.taxRate) : "");
  const [country, setCountry] = useState(url.country || DEFAULT_COUNTRY);
  const countryData = COUNTRIES[country] || COUNTRIES[DEFAULT_COUNTRY];
  const sym = countryData.currency;
  _globalSym = sym; // keep global in sync for ChartTooltip
  const [submitted, setSubmitted] = useState(!!url.age);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const shareCardRef = useRef(null);

  // Load GA once on mount
  useEffect(() => { loadGA(); }, []);

  const [whatIfContrib, setWhatIfContrib] = useState(null);
  const [whatIfExpenses, setWhatIfExpenses] = useState(null);
  const [whatIfRetireAge, setWhatIfRetireAge] = useState(null);

  const result = useMemo(() => {
    const windfallVal = Number(windfall) || 0;
    const oneOffVal = Number(oneOff) || 0;
    const annualIrregularVal = Number(annualIrregular) || 0;
    const monthlyIrregularVal = Number(monthlyIrregular) || 0;
    const ageVal = Number(age) || 27;
    const savingsVal = Number(savings) || 0;
    const monthlyContribVal = Number(monthlyContrib) || 0;
    const annualExpensesVal = Number(annualExpenses) || 50000;
    const returnRateVal = Number(returnRate) || 7;
    const inflationRateVal = Number(inflationRate) || 3;
    const withdrawalRateVal = Number(withdrawalRate) || 4;

    const statePensionVal = Number(statePension) || 0;
    const taxRateVal = Math.min(Number(taxRate) || 0, 99) / 100;
    const netExpenses = Math.max(0, annualExpensesVal - statePensionVal);
    const grossExpenses = taxRateVal > 0 ? netExpenses / (1 - taxRateVal) : netExpenses;
    const fireNumber = grossExpenses / (withdrawalRateVal / 100);
    const realReturn = (1 + returnRateVal / 100) / (1 + inflationRateVal / 100) - 1;
    const monthlyReturn = Math.pow(1 + realReturn, 1 / 12) - 1;
    const cMonthlyReturn = Math.pow(1 + Math.max(0, realReturn - 0.01), 1 / 12) - 1;
    const aMonthlyReturn = Math.pow(1 + realReturn + 0.01, 1 / 12) - 1;

    const baseYears = calcYearsToFire(savingsVal, monthlyContribVal, fireNumber, realReturn);
    const withExpensesYears = calcYearsToFire(savingsVal + windfallVal, monthlyContribVal, fireNumber, realReturn, oneOffVal, annualIrregularVal, monthlyIrregularVal);
    const impactYears = withExpensesYears - baseYears;

    let portfolio = savingsVal, cPort = savingsVal, aPort = savingsVal;
    let adjPort = Math.max(0, savingsVal + windfallVal - oneOffVal);
    let totalContributed = savingsVal, year = 0;
    const chartData = [], breakdownData = [];
    const maxYears = Math.max(withExpensesYears, baseYears) + 1;
    const mIrr = monthlyIrregularVal, aIrr = annualIrregularVal;

    while (year < maxYears && year < 60) {
      chartData.push({ year, age: ageVal + year, portfolio: Math.round(portfolio), conservative: Math.round(cPort), aggressive: Math.round(aPort), adjusted: Math.round(adjPort), fireNumber: Math.round(fireNumber) });
      breakdownData.push({ year, age: ageVal + year, contributions: Math.round(totalContributed), growth: Math.max(0, Math.round(portfolio - totalContributed)) });
      for (let m = 0; m < 12; m++) {
        portfolio = portfolio * (1 + monthlyReturn) + monthlyContribVal;
        cPort = cPort * (1 + cMonthlyReturn) + monthlyContribVal;
        aPort = aPort * (1 + aMonthlyReturn) + monthlyContribVal;
        adjPort = adjPort * (1 + monthlyReturn) + (monthlyContribVal - mIrr);
        totalContributed += monthlyContribVal;
      }
      adjPort -= aIrr;
      year++;
    }
    chartData.push({ year, age: ageVal + year, portfolio: Math.round(portfolio), conservative: Math.round(cPort), aggressive: Math.round(aPort), adjusted: Math.round(adjPort), fireNumber: Math.round(fireNumber) });
    breakdownData.push({ year, age: ageVal + year, contributions: Math.round(totalContributed), growth: Math.max(0, Math.round(portfolio - totalContributed)) });

    return { fireNumber, yearsToFire: baseYears, fireAge: ageVal + baseYears, withExpensesYears, withExpensesAge: ageVal + withExpensesYears, impactYears, chartData, breakdownData, ageVal, savingsVal, monthlyContribVal, annualExpensesVal, returnRateVal, inflationRateVal, withdrawalRateVal, realReturn, statePensionVal, netExpenses, taxRateVal, grossExpenses };
  }, [age, savings, monthlyContrib, annualExpenses, returnRate, inflationRate, withdrawalRate, windfall, oneOff, annualIrregular, monthlyIrregular, statePension, taxRate]);

  const contribSlider = whatIfContrib ?? result.monthlyContribVal;
  const expensesSlider = whatIfExpenses ?? result.annualExpensesVal;
  const retireAgeSlider = whatIfRetireAge ?? result.fireAge;

  const whatIfYears = calcYearsToFire(result.savingsVal, contribSlider, result.annualExpensesVal / (result.withdrawalRateVal / 100), result.realReturn);
  const whatIfFireAge = result.ageVal + whatIfYears;

  const reqSavings = calcRequiredMonthlySavings(result.savingsVal, result.fireNumber, result.realReturn, Math.max(1, retireAgeSlider - result.ageVal));
  const reqExpenses = calcRequiredExpenses(result.savingsVal, result.monthlyContribVal, result.realReturn, Math.max(1, retireAgeSlider - result.ageVal), result.withdrawalRateVal / 100);

  const whatIfExpFireAge = result.ageVal + calcYearsToFire(result.savingsVal, result.monthlyContribVal, expensesSlider / (result.withdrawalRateVal / 100), result.realReturn);


  const handleCountryChange = (newCountry) => {
    setCountry(newCountry);
    const d = COUNTRIES[newCountry].defaults;
    if (!savings) setSavings(d.savings);
    if (!monthlyContrib) setMonthlyContrib(d.monthlyContrib);
    if (!annualExpenses) setAnnualExpenses(d.annualExpenses);
    if (!returnRate) setReturnRate(d.returnRate);
    if (!inflationRate) setInflationRate(d.inflationRate);
    if (!withdrawalRate) setWithdrawalRate(d.withdrawalRate);
    trackEvent("country_changed", { country: newCountry });
  };

  const handleSaveImage = () => {
    if (saving) return;
    setSaving(true);
    trackEvent("save_results_image", { fire_age: result.fireAge, years_to_fire: result.yearsToFire });

    try {
      const W = 800, H = 480;
      const canvas = document.createElement("canvas");
      canvas.width = W * 2; canvas.height = H * 2;
      const ctx = canvas.getContext("2d");
      ctx.scale(2, 2);

      // Background
      ctx.fillStyle = "#0f1117";
      ctx.fillRect(0, 0, W, H);

      // Header bar
      ctx.fillStyle = "#1a1d27";
      ctx.fillRect(0, 0, W, 56);

      // Fire emoji circle
      ctx.fillStyle = "#f97316";
      ctx.beginPath(); ctx.arc(36, 28, 16, 0, Math.PI * 2); ctx.fill();
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔥", 36, 34);

      // App title
      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("FIRE Calculus — My Results", 62, 33);

      // Subtitle right
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("firecalculus.com · Free · No sign-up · No data stored", W - 20, 33);

      // 4 stat cards
      const cards = [
        { label: "I CAN RETIRE AT", value: `Age ${result.fireAge}`, color: "#f97316" },
        { label: "FIRE NUMBER", value: fmt(result.fireNumber), color: "#10b981" },
        { label: "YEARS TO FIRE", value: `${result.yearsToFire} years`, color: "#818cf8" },
        { label: "MONTHLY BUDGET", value: fmt(Math.round((Number(result.annualExpensesVal) || 0) / 12)) + "/mo", color: "#38bdf8" },
      ];
      const cardW = (W - 60) / 4, cardH = 110, cardY = 76;
      cards.forEach((c, i) => {
        const x = 20 + i * (cardW + 6.5);
        // Card bg
        ctx.fillStyle = "#1a1d27";
        ctx.beginPath();
        ctx.roundRect(x, cardY, cardW, cardH, 10);
        ctx.fill();
        // Top accent
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.roundRect(x, cardY, cardW, 3, [3, 3, 0, 0]);
        ctx.fill();
        // Label
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(c.label, x + 12, cardY + 24);
        // Value
        ctx.fillStyle = c.color;
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(c.value, x + 12, cardY + 60);
      });

      // Mini chart
      const chartX = 20, chartY = 210, chartW = W - 40, chartH = 200;
      ctx.fillStyle = "#1a1d27";
      ctx.beginPath(); ctx.roundRect(chartX, chartY, chartW, chartH, 10); ctx.fill();

      ctx.fillStyle = "#f1f5f9";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("📈 Portfolio Growth", chartX + 14, chartY + 22);

      const data = result.chartData;
      const maxVal = Math.max(...data.map(d => d.aggressive), result.fireNumber * 1.1);
      const padL = 60, padR = 20, padT = 40, padB = 30;
      const pW = chartW - padL - padR, pH = chartH - padT - padB;

      const px = (i) => chartX + padL + (i / (data.length - 1)) * pW;
      const py = (v) => chartY + padT + pH - (v / maxVal) * pH;

      // Grid lines
      ctx.strokeStyle = "#1e2130"; ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach(t => {
        const y = chartY + padT + pH * (1 - t);
        ctx.beginPath(); ctx.moveTo(chartX + padL, y); ctx.lineTo(chartX + padL + pW, y); ctx.stroke();
        ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif"; ctx.textAlign = "right";
        const v = maxVal * t;
        ctx.fillText(v >= 1e6 ? `${sym}${(v/1e6).toFixed(1)}M` : `${sym}${(v/1000).toFixed(0)}k`, chartX + padL - 4, y + 3);
      });

      // FIRE reference line
      ctx.strokeStyle = "#f97316"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]);
      const fireY = py(result.fireNumber);
      ctx.beginPath(); ctx.moveTo(chartX + padL, fireY); ctx.lineTo(chartX + padL + pW, fireY); ctx.stroke();
      ctx.setLineDash([]);

      // Draw lines
      const lines = [
        { key: "aggressive", color: "#10b981", width: 2, dash: [] },
        { key: "portfolio", color: "#f97316", width: 3, dash: [] },
        { key: "conservative", color: "#f87171", width: 2, dash: [4, 2] },
      ];
      lines.forEach(({ key, color, width, dash }) => {
        ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash);
        ctx.beginPath();
        data.forEach((d, i) => {
          i === 0 ? ctx.moveTo(px(i), py(d[key])) : ctx.lineTo(px(i), py(d[key]));
        });
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // X axis labels
      ctx.fillStyle = "#64748b"; ctx.font = "10px sans-serif"; ctx.textAlign = "center";
      const step = Math.ceil(data.length / 6);
      data.forEach((d, i) => {
        if (i % step === 0) ctx.fillText(d.age, px(i), chartY + padT + pH + 16);
      });

      // Legend
      const legendItems = [
        { label: "Aggressive", color: "#10b981" },
        { label: "Base Case", color: "#f97316" },
        { label: "Conservative", color: "#f87171" },
        { label: `FIRE: ${fmt(result.fireNumber)}`, color: "#f97316", dashed: true },
      ];
      let lx = chartX + padL;
      legendItems.forEach(({ label, color, dashed }) => {
        ctx.strokeStyle = color; ctx.lineWidth = 2;
        if (dashed) ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.moveTo(lx, chartY + chartH - 8); ctx.lineTo(lx + 20, chartY + chartH - 8); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
        ctx.fillText(label, lx + 24, chartY + chartH - 4);
        lx += ctx.measureText(label).width + 50;
      });

      // Download
      const link = document.createElement("a");
      link.download = "my-fire-results.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (e) {
      console.error("Save image error:", e);
    }
    setSaving(false);
  };

  const inputBase = {
    width: "100%", padding: "10px 12px", borderRadius: 8,
    border: `1.5px solid ${dark.border}`, fontSize: 15, outline: "none",
    boxSizing: "border-box", background: "#0f1117", color: dark.text,
    MozAppearance: "textfield", WebkitAppearance: "none"
  };

  const hasIrregulars = Number(windfall) > 0 || Number(oneOff) > 0 || Number(annualIrregular) > 0 || Number(monthlyIrregular) > 0;

  const t = countryData.tooltips;
  const fields = [
    { label: "Current Age", tooltip: "Your age today. This determines how many years you have to reach FIRE.", value: age, set: setAge, suffix: "yrs", min: 18, max: 70 },
    { label: "Current Savings", tooltip: t.savings, value: savings, set: setSavings, prefix: sym, min: 0, max: 5000000, step: 1000 },
    { label: "Monthly Contribution", tooltip: t.monthlyContrib, value: monthlyContrib, set: setMonthlyContrib, prefix: sym, suffix: "/mo", min: 0, max: 50000, step: 100 },
    { label: "Annual Expenses (Retirement)", tooltip: t.annualExpenses, value: annualExpenses, set: setAnnualExpenses, prefix: sym, suffix: "/yr", min: 10000, max: 500000, step: 1000 },
    { label: "Expected Annual Return", tooltip: t.returnRate, value: returnRate, set: setReturnRate, suffix: "%", min: 1, max: 15, step: 0.5 },
    { label: "Inflation Rate", tooltip: t.inflationRate, value: inflationRate, set: setInflationRate, suffix: "%", min: 0, max: 10, step: 0.5 },
    { label: "Safe Withdrawal Rate", tooltip: t.withdrawalRate, value: withdrawalRate, set: setWithdrawalRate, suffix: "%", min: 2, max: 6, step: 0.5 },
    { label: "Expected Gov. Pension / Social Security", tooltip: t.statePension, value: statePension, set: setStatePension, prefix: sym, suffix: "/yr", min: 0, max: 100000, step: 500 },
    { label: "Effective Tax Rate on Withdrawals", tooltip: t.taxRate, value: taxRate, set: setTaxRate, suffix: "%", min: 0, max: 60, step: 1 },
  ];

  const irregularFields = [
    { label: "Expected Windfall / Inheritance", tooltip: "A one-time lump sum you expect to receive, like an inheritance or bonus. This is added directly to your savings today.", value: windfall, set: setWindfall, prefix: sym, step: 1000 },
    { label: "One-off Big Expense", tooltip: "A large one-time cost like a wedding, car, or house deposit. This is deducted from your portfolio once immediately.", value: oneOff, set: setOneOff, prefix: sym, step: 1000 },
    { label: "Annual Irregular Expenses", tooltip: "Costs that happen once a year but aren't in your regular budget — e.g. holidays, home repairs, insurance. These reduce your portfolio each year.", value: annualIrregular, set: setAnnualIrregular, prefix: sym, suffix: "/yr", step: 500 },
    { label: "Monthly Irregular Expenses", tooltip: "Extra monthly costs outside your core budget — e.g. dining out, subscriptions, hobbies. These reduce your monthly contributions.", value: monthlyIrregular, set: setMonthlyIrregular, prefix: sym, suffix: "/mo", step: 100 },
  ];

  const milestones = [
    { label: "25x (Lean FIRE)", value: result.annualExpensesVal * 25, color: dark.blue },
    { label: "50x (Fat FIRE)", value: result.annualExpensesVal * 50, color: dark.purple },
  ];

  const sliderTrack = (val, min, max, color) => ({
    background: `linear-gradient(to right, ${color} 0%, ${color} ${((val - min) / (max - min)) * 100}%, #2a2d3a ${((val - min) / (max - min)) * 100}%, #2a2d3a 100%)`,
  });

  return (
    <div style={{ minHeight: "100vh", background: dark.bg, fontFamily: "'Inter', sans-serif", color: dark.text }}>
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        input[type=range] { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 4px; outline: none; cursor: pointer; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #f97316; cursor: pointer; box-shadow: 0 0 6px rgba(249,115,22,0.5); }
      `}</style>

      <div style={{ background: dark.card, padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ background: dark.orange, borderRadius: 8, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🔥</div>
        <span style={{ fontWeight: 800, fontSize: 18 }}>FIRE Calculus</span>
        <span style={{ marginLeft: "auto", fontSize: 13, color: dark.muted }}>Free · No sign-up · No data stored</span>
      </div>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>When can you <span style={{ color: dark.orange }}>retire early?</span></h1>
          <p style={{ color: dark.muted, marginTop: 10, fontSize: 16 }}>Enter your numbers and get your FIRE date instantly.</p>
        </div>

        {/* Country Selector */}
        <div style={{ background: dark.card, borderRadius: 16, padding: "20px 28px", border: `1px solid ${dark.border}`, marginBottom: 16 }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, color: dark.muted, textTransform: "uppercase", letterSpacing: 0.5 }}>🌍 Select Your Country</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {Object.entries(COUNTRIES).map(([code, c]) => (
              <button key={code} onClick={() => handleCountryChange(code)}
                style={{ padding: "8px 16px", borderRadius: 8, border: `1.5px solid ${country === code ? dark.orange : dark.border}`, background: country === code ? "rgba(249,115,22,0.12)" : "#0f1117", color: country === code ? dark.orange : dark.text, fontWeight: country === code ? 700 : 400, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                {c.flag} {c.name}
              </button>
            ))}
          </div>
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
                  <input type="number" value={value} placeholder="0" min={min} max={max} step={step}
                    onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ ...inputBase, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 40 : 12 }} />
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
                  <input type="number" value={value} placeholder="0" min={0} step={step}
                    onChange={(e) => set(e.target.value === "" ? "" : Number(e.target.value))}
                    style={{ ...inputBase, paddingLeft: prefix ? 22 : 12, paddingRight: suffix ? 40 : 12 }} />
                  {suffix && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: dark.muted, fontSize: 13 }}>{suffix}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => {
            setSubmitted(true); setWhatIfContrib(null); setWhatIfExpenses(null); setWhatIfRetireAge(null);
            trackEvent("calculate_fire", { age: Number(age) || 0, annual_expenses: Number(annualExpenses) || 0, monthly_contrib: Number(monthlyContrib) || 0 });
          }}
          style={{ width: "100%", padding: 14, background: dark.orange, color: "#fff", fontWeight: 700, fontSize: 16, border: "none", borderRadius: 10, cursor: "pointer", boxShadow: `0 0 24px rgba(249,115,22,0.4)`, marginBottom: 28 }}>
          Calculate My FIRE Date →
        </button>

        {submitted && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
              {[
                { label: "FIRE Date", value: `Age ${result.fireAge}`, sub: `In ${result.yearsToFire} years`, color: dark.orange },
                { label: "FIRE Number", value: fmt(result.fireNumber), sub: Number(statePension) > 0 && Number(taxRate) > 0 ? `After pension & ${taxRate}% tax` : Number(statePension) > 0 ? `After ${fmt(Number(statePension))}/yr pension` : Number(taxRate) > 0 ? `Incl. ${taxRate}% withdrawal tax` : "Portfolio needed", color: dark.green },
                { label: "Years to FIRE", value: `${result.yearsToFire} yrs`, sub: result.yearsToFire < 20 ? "🔥 Retiring early!" : "On track", color: dark.purple },
                { label: "Monthly Budget", value: fmt(Number(annualExpenses) / 12 || 0), sub: "In today's dollars", color: dark.blue },
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

            {/* Country FIRE Tips */}
            <div style={{ background: dark.card, borderRadius: 14, padding: "20px 24px", border: `1px solid ${dark.border}`, borderLeft: `4px solid ${dark.blue}`, marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: dark.text, margin: "0 0 12px" }}>{countryData.flag} {countryData.name} FIRE Tips</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {countryData.tips.map((tip, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ color: dark.blue, fontWeight: 700, fontSize: 13, minWidth: 18 }}>→</span>
                    <span style={{ fontSize: 13, color: dark.muted, lineHeight: 1.5 }}>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24, display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleSaveImage} disabled={saving} style={{ padding: "10px 20px", background: saving ? dark.border : dark.orange, color: "#fff", border: "none", borderRadius: 8, cursor: saving ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 600, boxShadow: saving ? "none" : `0 0 16px rgba(249,115,22,0.3)` }}>
                {saving ? "⏳ Saving..." : "📸 Save as Image"}
              </button>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 4px 16px", fontWeight: 700, fontSize: 16 }}>📈 Portfolio Growth</h3>
              <p style={{ margin: "0 0 20px 16px", fontSize: 13, color: dark.muted }}>Base, conservative & aggressive scenarios with FIRE milestones</p>
              <ResponsiveContainer width="100%" height={360}>
                <LineChart data={result.chartData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e2130" />
                  <XAxis dataKey="age" stroke={dark.muted} tick={{ fontSize: 12, fill: dark.muted }} label={{ value: "Age", position: "insideBottom", offset: -10, fill: dark.muted, fontSize: 12 }} />
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65} tickFormatter={(v) => v >= 1e6 ? `${sym}${(v / 1e6).toFixed(1)}M` : `${sym}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16, color: dark.muted }} />
                  {milestones.map(m => <ReferenceLine key={m.label} y={m.value} stroke={m.color} strokeDasharray="5 3" />)}
                  <ReferenceLine y={result.fireNumber} stroke={dark.orange} strokeDasharray="6 3" strokeWidth={2} />
                  <Line type="monotone" dataKey="aggressive" name="Aggressive" stroke={dark.green} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="portfolio" name="Base Case" stroke={dark.orange} strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="conservative" name="Conservative" stroke={dark.red} strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  {hasIrregulars && <Line type="monotone" dataKey="adjusted" name="With Irregulars" stroke={dark.blue} strokeWidth={2} dot={false} strokeDasharray="6 3" />}
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px", padding: "8px 16px 4px", justifyContent: "center" }}>
                <span style={{ fontSize: 12, color: dark.orange, display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-block", width: 24, borderTop: `2px dashed ${dark.orange}` }} /> FIRE Target: {fmt(result.fireNumber)}</span>
                {milestones.map(m => (
                  <span key={m.label} style={{ fontSize: 12, color: m.color, display: "flex", alignItems: "center", gap: 6 }}><span style={{ display: "inline-block", width: 24, borderTop: `2px dashed ${m.color}` }} />{m.label}: {fmt(m.value)}</span>
                ))}
              </div>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: "24px 8px 16px", border: `1px solid ${dark.border}`, marginBottom: 20 }}>
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
                  <YAxis stroke={dark.muted} tick={{ fontSize: 11, fill: dark.muted }} width={65} tickFormatter={(v) => v >= 1e6 ? `${sym}${(v / 1e6).toFixed(1)}M` : `${sym}${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16, color: dark.muted }} />
                  <Area type="monotone" dataKey="contributions" name="Your Contributions" stroke={dark.purple} fill="url(#gContrib)" strokeWidth={2} />
                  <Area type="monotone" dataKey="growth" name="Market Growth" stroke={dark.green} fill="url(#gGrowth)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: dark.card, borderRadius: 16, padding: 28, border: `1px solid ${dark.border}`, marginBottom: 20 }}>
              <h3 style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 16 }}>🎯 What If? Explorer</h3>
              <p style={{ margin: "0 0 28px", fontSize: 13, color: dark.muted }}>Drag the sliders to explore different scenarios instantly</p>

              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dark.text }}>💰 What if I save <span style={{ color: dark.orange }}>{fmt(contribSlider)}/mo</span>?</span>
                  <span style={{ fontSize: 13, color: whatIfFireAge < result.fireAge ? dark.green : whatIfFireAge > result.fireAge ? dark.red : dark.muted, fontWeight: 700 }}>
                    → FIRE at Age {whatIfFireAge} {whatIfFireAge < result.fireAge ? `(${result.fireAge - whatIfFireAge} yrs earlier 🎉)` : whatIfFireAge > result.fireAge ? `(${whatIfFireAge - result.fireAge} yrs later)` : "(no change)"}
                  </span>
                </div>
                <input type="range" min={0} max={20000} step={100} value={contribSlider}
                  onChange={(e) => { setWhatIfContrib(Number(e.target.value)); trackEvent("whatif_contrib_slider", { value: Number(e.target.value) }); }}
                  style={{ width: "100%", ...sliderTrack(contribSlider, 0, 20000, dark.orange) }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: dark.muted, marginTop: 4 }}>
                  <span>{sym}0</span><span>{sym}20,000/mo</span>
                </div>
              </div>

              <div style={{ marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dark.text }}>🛍️ What if I spend <span style={{ color: dark.purple }}>{fmt(expensesSlider)}/yr</span> in retirement?</span>
                  <span style={{ fontSize: 13, color: whatIfExpFireAge < result.fireAge ? dark.green : whatIfExpFireAge > result.fireAge ? dark.red : dark.muted, fontWeight: 700 }}>
                    → FIRE at Age {whatIfExpFireAge} {whatIfExpFireAge < result.fireAge ? `(${result.fireAge - whatIfExpFireAge} yrs earlier 🎉)` : whatIfExpFireAge > result.fireAge ? `(${whatIfExpFireAge - result.fireAge} yrs later)` : "(no change)"}
                  </span>
                </div>
                <input type="range" min={10000} max={200000} step={1000} value={expensesSlider}
                  onChange={(e) => { setWhatIfExpenses(Number(e.target.value)); trackEvent("whatif_expenses_slider", { value: Number(e.target.value) }); }}
                  style={{ width: "100%", ...sliderTrack(expensesSlider, 10000, 200000, dark.purple) }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: dark.muted, marginTop: 4 }}>
                  <span>{sym}10k/yr</span><span>{sym}200k/yr</span>
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: dark.text }}>🎯 What if I want to retire at <span style={{ color: dark.green }}>Age {retireAgeSlider}</span>?</span>
                  <span style={{ fontSize: 13, color: dark.muted, fontWeight: 700 }}>In {Math.max(0, retireAgeSlider - result.ageVal)} years</span>
                </div>
                <input type="range" min={result.ageVal + 1} max={75} step={1} value={retireAgeSlider}
                  onChange={(e) => { setWhatIfRetireAge(Number(e.target.value)); trackEvent("whatif_retire_age_slider", { value: Number(e.target.value) }); }}
                  style={{ width: "100%", ...sliderTrack(retireAgeSlider, result.ageVal + 1, 75, dark.green) }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: dark.muted, marginTop: 4 }}>
                  <span>Age {result.ageVal + 1}</span><span>Age 75</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                  <div style={{ background: "#0f1117", borderRadius: 10, padding: "14px 16px", border: `1px solid ${dark.border}` }}>
                    <p style={{ fontSize: 11, color: dark.muted, margin: "0 0 4px", textTransform: "uppercase" }}>Monthly savings needed</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: dark.green, margin: 0 }}>{reqSavings > 0 ? fmt(reqSavings) + "/mo" : "Already there! 🎉"}</p>
                  </div>
                  <div style={{ background: "#0f1117", borderRadius: 10, padding: "14px 16px", border: `1px solid ${dark.border}` }}>
                    <p style={{ fontSize: 11, color: dark.muted, margin: "0 0 4px", textTransform: "uppercase" }}>Max annual expenses</p>
                    <p style={{ fontSize: 20, fontWeight: 800, color: dark.purple, margin: 0 }}>{fmt(reqExpenses)}/yr</p>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "center", color: dark.muted, fontSize: 13 }}>
              💡 Hit "Save as Image" above and share your results on Reddit or with a friend!
            </div>
          </>
        )}
      </div>
    </div>
  );
}
