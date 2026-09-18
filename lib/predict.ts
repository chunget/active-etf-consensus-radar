import { etfProvider, macroProvider, marketProvider } from "./providers";
import type { Etf, Horizon, MacroEvent, PredictionRequest, RankedStock, Stock } from "./types";

type Signal = {
  growth: number;
  aiDemand: number;
  cyclical: number;
  rateDown: number;
  financials: number;
  defensive: number;
  energy: number;
  dollarWeak: number;
  riskOn: number;
};

const keys = ["growth", "aiDemand", "cyclical", "rateDown", "financials", "defensive", "energy", "dollarWeak", "riskOn"] as const;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function rounded(value: number) {
  return Math.round(value);
}

function eventSurprise(event: MacroEvent, usePrevious = false) {
  const base = usePrevious ? event.previous : event.actual;
  const scale = Math.max(Math.abs(event.expected) * 0.08, 0.6);
  return clamp((base - event.expected) / scale, -2.5, 2.5);
}

function signalFromEvents(events: MacroEvent[], usePrevious = false): Signal {
  const out: Signal = { growth: 0, aiDemand: 0, cyclical: 0, rateDown: 0, financials: 0, defensive: 0, energy: 0, dollarWeak: 0, riskOn: 0 };
  for (const event of events) {
    const s = eventSurprise(event, usePrevious);
    if (event.kind === "inflation") {
      out.rateDown -= s * 1.2; out.growth -= s * 0.9; out.financials += s * 0.35; out.defensive += s * 0.25; out.riskOn -= s * 0.7;
    } else if (event.kind === "jobs") {
      out.cyclical += s * 0.9; out.financials += s * 0.45; out.riskOn += s * 0.35; out.rateDown -= s * 0.25;
    } else if (event.kind === "yield") {
      out.rateDown -= s * 1.2; out.growth -= s * 0.8; out.financials += s * 0.5; out.defensive += s * 0.3;
    } else if (event.kind === "exports") {
      out.aiDemand += s * 0.9; out.cyclical += s * 0.7; out.growth += s * 0.55; out.riskOn += s * 0.35;
    } else if (event.kind === "vol") {
      out.riskOn -= s * 1.2; out.defensive += s * 0.7; out.growth -= s * 0.3;
    } else if (event.kind === "dollar") {
      out.dollarWeak -= s; out.growth -= s * 0.35; out.energy -= s * 0.2;
    } else if (event.kind === "breadth") {
      out.riskOn += s * 0.9; out.cyclical += s * 0.45; out.growth += s * 0.35;
    }
  }
  const damp = 1 / (1 + 0.12 * Math.max(0, events.length - 1));
  for (const key of keys) out[key] = clamp(out[key] * damp, -3, 3);
  return out;
}

function stockVector(stock: Stock): Signal {
  const text = `${stock.industry} ${stock.themes.join(" ")}`;
  return {
    growth: text.includes("AI") || text.includes("雲端") || text.includes("資料") ? 1.1 : text.includes("金融") ? -0.2 : 0.2,
    aiDemand: text.includes("AI") || text.includes("ASIC") || text.includes("散熱") || text.includes("半導體") ? 1.25 : -0.1,
    cyclical: text.includes("塑化") || text.includes("記憶體") || text.includes("電子") ? 0.9 : 0.15,
    rateDown: text.includes("降息") || text.includes("金融") || text.includes("雲端") ? 0.55 : 0.1,
    financials: text.includes("金融") ? 1.25 : -0.15,
    defensive: text.includes("股息") || text.includes("金融") || text.includes("能源") ? 0.6 : 0,
    energy: text.includes("能源") || text.includes("電力") ? 1.2 : 0,
    dollarWeak: stock.market === "TW" ? 0.45 : 0.1,
    riskOn: text.includes("ARK") || text.includes("AI") || text.includes("電動車") ? 0.9 : 0.15,
  };
}

function dot(a: Signal, b: Signal) {
  return keys.reduce((sum, key) => sum + a[key] * b[key], 0);
}

function scoreStock(stock: Stock, signal: Signal, horizon: Horizon) {
  const h = horizon / 20;
  const match = dot(stockVector(stock), signal);
  const flow = stock.flow1 * (1 - h) + stock.flow20 * (0.35 + h);
  const prior = stock.prior - 62;
  const value = stock.valueTilt * (0.5 + h);
  const raw = prior * (0.35 + h * 0.35) + match * (9 - h * 3.2) + flow * (0.72 + h * 0.45) + value;
  return clamp(50 + Math.tanh(raw / 42) * 46, 18, 97);
}

function etfStyle(etf: Etf): Signal {
  const n = etf.name;
  const seed = (etf.code.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 11) / 80;
  return {
    growth: n.includes("科技") || n.includes("創新") || n.includes("成長") || n.includes("ARK") ? 1.15 + seed : n.includes("高息") || n.includes("股息") ? 0.05 : 0.45,
    aiDemand: n.includes("AI") || n.includes("科技") || n.includes("前沿") || n.includes("ARK") ? 1.2 + seed : 0.25,
    cyclical: n.includes("動能") || n.includes("強棒") || n.includes("增長") ? 0.75 : 0.28,
    rateDown: n.includes("股息") || n.includes("收益") || n.includes("金融") ? 0.65 : 0.35,
    financials: n.includes("金融") || n.includes("股息") || n.includes("高息") ? 0.95 : 0.2,
    defensive: n.includes("高息") || n.includes("收益") || n.includes("股息") ? 1.05 : 0.25,
    energy: n.includes("全球") ? 0.35 : 0.15,
    dollarWeak: etf.scope === "TW" ? 0.55 : 0.2,
    riskOn: n.includes("ARK") || n.includes("動能") || n.includes("創新") || n.includes("前沿") ? 1.08 : 0.35,
  };
}

function centeredCosine(a: Signal, b: Signal) {
  const am = keys.reduce((s, k) => s + a[k], 0) / keys.length;
  const bm = keys.reduce((s, k) => s + b[k], 0) / keys.length;
  let top = 0, aa = 0, bb = 0;
  for (const key of keys) {
    const av = a[key] - am;
    const bv = b[key] - bm;
    top += av * bv; aa += av * av; bb += bv * bv;
  }
  return top / Math.max(0.001, Math.sqrt(aa * bb));
}

function affinity(etf: Etf, stock: Stock, strength: number, horizon: Horizon) {
  const scopeFit = etf.scope === "GLOBAL" || (etf.scope === "US" && stock.market === "US") || (etf.scope === "TW" && stock.market === "TW") ? 0.08 : -0.15;
  const turnover = etf.name.includes("動能") || etf.name.includes("ARK") || etf.name.includes("強棒") ? stock.flow1 : stock.flow20 / 2;
  const sizeFit = stock.size === "mega" && etf.name.includes("50") ? 0.08 : stock.size === "mid" && etf.name.includes("ARK") ? 0.07 : 0;
  const wobble = ((etf.code.charCodeAt(2) + stock.code.charCodeAt(0) + horizon) % 9) / 100;
  return clamp(0.55 + centeredCosine(etfStyle(etf), stockVector(stock)) * 0.23 + (strength - 50) / 170 + turnover / 260 + scopeFit + sizeFit + wobble, 0.2, 0.98);
}

function levelFromAffinity(v: number) {
  if (v >= 0.8) return "高";
  if (v >= 0.715) return "中高";
  if (v >= 0.62) return "中";
  return "低";
}

function trend(delta: number): "up" | "flat" | "down" {
  if (delta > 2) return "up";
  if (delta < -2) return "down";
  return "flat";
}

export async function predict(input: PredictionRequest) {
  const [allEvents, etfs, stocks, themes] = await Promise.all([macroProvider.list(), etfProvider.list(), marketProvider.stocks(), marketProvider.themes()]);
  const usedEvents = allEvents.filter((event) => input.selectedEvents.includes(event.id));
  const eventsForRun = usedEvents.length ? usedEvents : allEvents.filter((event) => event.fresh).slice(0, 3);
  const signal = signalFromEvents(eventsForRun);
  const previousSignal = signalFromEvents(eventsForRun, true);
  const selectedTheme = input.themeId ? themes.find((theme) => theme.id === input.themeId) : undefined;
  const scopedStocks = selectedTheme ? stocks.filter((stock) => stock.themes.includes(selectedTheme.name)) : stocks;

  const scored = scopedStocks.map((stock) => {
    const strengthBase = scoreStock(stock, signal, input.forecastHorizon);
    const prevBase = scoreStock(stock, previousSignal, input.forecastHorizon);
    const matches = etfs.map((etf) => ({ etf, affinity: affinity(etf, stock, strengthBase, input.forecastHorizon) }));
    const count = matches.filter((m) => m.affinity >= 0.62).length;
    const prevCount = etfs.filter((etf) => affinity(etf, stock, prevBase, input.forecastHorizon) >= 0.62).length;
    const coverageBoost = 34 + (count / etfs.length) * 66;
    const strength = rounded(clamp(strengthBase * 0.7 + coverageBoost * 0.3, 18, 97));
    return { stock, strength, prev: prevBase, matches, count, prevCount };
  }).sort((a, b) => b.strength - a.strength);

  const stockRanking: RankedStock[] = scored.slice(0, 20).map((item, index) => ({
    rank: index + 1,
    code: item.stock.code,
    name: item.stock.name,
    industry: item.stock.industry,
    tags: item.stock.themes.slice(0, 3),
    strength: item.strength,
    etfCount: item.count,
    etfTotal: etfs.length,
    etfCountDelta: item.count - item.prevCount,
    trend: trend(item.strength - item.prev),
    note: item.stock.flow1 < 0 && item.stock.flow20 > 8 ? "短線降溫/中期趨勢仍強" : undefined,
  }));

  const industryMap = new Map<string, { total: number; count: number; names: string[] }>();
  for (const item of scored) {
    const current = industryMap.get(item.stock.industry) ?? { total: 0, count: 0, names: [] };
    current.total += item.strength; current.count += 1; current.names.push(item.stock.name);
    industryMap.set(item.stock.industry, current);
  }
  const industryRanking = [...industryMap.entries()].map(([name, value]) => ({
    name,
    strength: rounded(value.total / value.count),
    stocks: value.names.slice(0, 4),
  })).sort((a, b) => b.strength - a.strength);

  const etfConsensus = Object.fromEntries(scored.slice(0, 20).map((item) => [
    item.stock.code,
    item.matches.sort((a, b) => b.affinity - a.affinity).slice(0, 8).map(({ etf, affinity }) => ({ code: etf.code, name: etf.name, level: levelFromAffinity(affinity) })),
  ]));

  const etfPreferences = Object.fromEntries(etfs.map((etf) => [
    etf.code,
    scored.map((item) => ({ code: item.stock.code, name: item.stock.name, level: levelFromAffinity(affinity(etf, item.stock, item.strength, input.forecastHorizon)) }))
      .sort((a, b) => ["高", "中高", "中", "低"].indexOf(a.level) - ["高", "中高", "中", "低"].indexOf(b.level))
      .slice(0, 7),
  ]));

  const positive = scored.filter((item) => item.strength >= 66).length;
  const cautious = scored.filter((item) => item.strength <= 45).length;
  const splitRatio = scored.length ? (2 * Math.min(positive, cautious)) / scored.length : 0;
  const disagreements = {
    bullish: positive,
    cautious,
    level: splitRatio > 0.45 ? "高" : splitRatio > 0.24 ? "中" : "低",
  };

  const riskTone = signal.riskOn + signal.growth + signal.aiDemand - signal.defensive;
  const regime = {
    label: riskTone > 1.2 ? "Risk-On" : riskTone < -1 ? "Risk-Off" : "中性",
    tone: riskTone > 1.2 ? "positive" : riskTone < -1 ? "cautious" : "neutral",
    drivers: eventsForRun.map((event) => `${event.name}${event.actual >= event.expected ? "高於" : event.actual < event.expected ? "低於" : "符合"}預期`).slice(0, 3),
  };

  const lead = stockRanking.slice(0, 3).map((s) => s.name).join("、");
  const summary = `模型推演顯示，主動 ETF 經理人可能偏向${industryRanking.slice(0, 2).map((i) => i.name).join("、")}，${lead}的共同配置傾向較明顯。`;

  return {
    date: input.date ?? new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
    horizon: input.forecastHorizon,
    usedEvents: eventsForRun.map(({ id, name, region, actual, expected, previous, unit, fresh }) => ({ id, name, region, actual, expected, previous, unit, fresh })),
    etfTotal: etfs.length,
    regime,
    summary: summary.length > 120 ? summary.slice(0, 119) : summary,
    stockRanking,
    industryRanking,
    etfConsensus,
    etfPreferences,
    disagreements,
    themes: themes.map((theme) => ({
      id: theme.id,
      name: theme.name,
      strength: rounded(stockRanking.filter((stock) => stock.tags.includes(theme.name)).reduce((sum, stock, _, arr) => sum + stock.strength / Math.max(1, arr.length), 0)) || 42,
      stocks: stockRanking.filter((stock) => stock.tags.includes(theme.name)).slice(0, 5),
    })),
    matrix: stockRanking.slice(0, 10).map((stock) => (etfConsensus[stock.code] ?? []).slice(0, 8).map((item: { level: string }) => item.level === "高" ? "H" : item.level === "中高" ? "MH" : item.level === "中" ? "M" : "L")),
  };
}
