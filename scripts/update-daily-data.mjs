import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = (name) => join(root, "data", name);
const DAY = 86_400_000;
const warnings = [];

const round = (value, digits = 2) => Number(value.toFixed(digits));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const number = (value) => Number(String(value ?? "").replaceAll(",", ""));

function formatDate(value, timeZone = "Asia/Taipei") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}/${part("month")}/${part("day")}`;
}

function isFresh(date, maxAgeDays) {
  return Date.now() - new Date(`${date}T00:00:00Z`).getTime() <= maxAgeDays * DAY;
}

async function fetchText(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "active-etf-consensus-radar/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 1_000));
    }
  }
  throw lastError;
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function readJson(name) {
  return JSON.parse(await readFile(dataPath(name), "utf8"));
}

async function writeJson(name, value) {
  await writeFile(dataPath(name), `${JSON.stringify(value, null, 2)}\n`);
}

async function fred(series) {
  const csv = await fetchText(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${series}`);
  return csv.trim().split(/\r?\n/).slice(1).map((line) => {
    const [date, raw] = line.split(",");
    return { date, raw, value: Number(raw) };
  }).filter((row) => row.date && row.raw?.trim() && Number.isFinite(row.value));
}

function dailyEvent({ id, name, kind, unit, rows, digits = 2 }) {
  const recent = rows.slice(-7);
  const latest = recent.at(-1);
  const previous = recent.at(-2) ?? latest;
  const baselineRows = recent.slice(0, -1);
  const baseline = baselineRows.reduce((sum, row) => sum + row.value, 0) / Math.max(1, baselineRows.length);
  return {
    id,
    region: "US",
    name,
    actual: round(latest.value, digits),
    expected: round(baseline, digits),
    previous: round(previous.value, digits),
    unit,
    releasedAt: `${latest.date}T00:00:00Z`,
    fresh: isFresh(latest.date, 8),
    kind,
  };
}

function yoyEvent({ id, name, rows }) {
  const latest = rows.at(-1);
  const previous = rows.at(-2);
  const yearAgo = rows.at(-13);
  const priorYearAgo = rows.at(-14);
  const actual = (latest.value / yearAgo.value - 1) * 100;
  const prior = (previous.value / priorYearAgo.value - 1) * 100;
  return {
    id,
    region: "US",
    name,
    actual: round(actual, 1),
    expected: round(prior, 1),
    previous: round(prior, 1),
    unit: "%",
    releasedAt: `${latest.date}T00:00:00Z`,
    fresh: isFresh(latest.date, 50),
    kind: "inflation",
  };
}

function payrollEvent(rows) {
  const latest = rows.at(-1);
  const previous = rows.at(-2);
  const beforePrevious = rows.at(-3);
  const actual = latest.value - previous.value;
  const prior = previous.value - beforePrevious.value;
  return {
    id: "us-payrolls",
    region: "US",
    name: "美國非農就業月增",
    actual: round(actual, 0),
    expected: round(prior, 0),
    previous: round(prior, 0),
    unit: "K",
    releasedAt: `${latest.date}T00:00:00Z`,
    fresh: isFresh(latest.date, 50),
    kind: "jobs",
  };
}

function yahooSymbol(stock) {
  if (stock.market === "US") return stock.code;
  return stock.code === "6510" ? `${stock.code}.TWO` : `${stock.code}.TW`;
}

async function quoteHistory(stock, completedThrough) {
  const symbol = encodeURIComponent(yahooSymbol(stock));
  const payload = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d&events=history`);
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const closes = result?.indicators?.adjclose?.[0]?.adjclose ?? result?.indicators?.quote?.[0]?.close ?? [];
  const timeZone = result.meta.exchangeTimezoneName;
  const rows = timestamps.map((timestamp, index) => ({
    timestamp,
    close: closes[index],
    date: formatDate(new Date(timestamp * 1_000), timeZone),
  })).filter((row) => Number.isFinite(row.close) && (!completedThrough || row.date <= completedThrough));
  if (rows.length < 21) throw new Error(`Insufficient history for ${stock.code}`);
  const latest = rows.at(-1);
  const prior = rows.at(-2);
  const start = rows.at(-21);
  return {
    date: latest.date,
    startDate: start.date,
    flow1: round((latest.close / prior.close - 1) * 100),
    flow20: round((latest.close / start.close - 1) * 100),
  };
}

async function updateStocks(stocks, completedThrough) {
  const output = [];
  const histories = new Map();
  for (let index = 0; index < stocks.length; index += 4) {
    const batch = stocks.slice(index, index + 4);
    const results = await Promise.allSettled(batch.map((stock) => quoteHistory(stock, completedThrough)));
    results.forEach((result, offset) => {
      const stock = batch[offset];
      if (result.status === "fulfilled") {
        histories.set(stock.code, result.value);
        output.push({
          ...stock,
          prior: round(clamp(62 + result.value.flow20 * 1.4, 25, 95), 0),
          flow1: result.value.flow1,
          flow20: result.value.flow20,
        });
      } else {
        warnings.push(`${stock.code} 報價沿用前次資料`);
        output.push(stock);
      }
    });
  }
  if (histories.size < Math.ceil(stocks.length * 0.6)) {
    throw new Error(`Only ${histories.size}/${stocks.length} stock quotes refreshed`);
  }
  return { stocks: output, histories };
}

function marketEvent(stocks, histories) {
  const moves = stocks.filter((stock) => stock.market === "TW")
    .map((stock) => histories.get(stock.code)?.flow20)
    .filter(Number.isFinite);
  const actual = moves.reduce((sum, value) => sum + value, 0) / Math.max(1, moves.length);
  return {
    id: "tw-tech-momentum",
    region: "TW",
    name: "台灣追蹤股 20 日動能",
    actual: round(actual),
    expected: 0,
    previous: round(actual - moves.reduce((sum, value) => sum + Math.sign(value), 0) / Math.max(1, moves.length)),
    unit: "%",
    releasedAt: new Date().toISOString(),
    fresh: true,
    kind: "exports",
  };
}

function rocDate(value) {
  const text = String(value ?? "");
  if (!/^\d{7}$/.test(text)) return null;
  return `${Number(text.slice(0, 3)) + 1911}/${text.slice(3, 5)}/${text.slice(5, 7)}`;
}

function activeEtfData(rows, previousEtfs) {
  const activeRows = rows.filter((row) => String(row.Code).endsWith("A") && String(row.Name).startsWith("主動"));
  if (!activeRows.length) return { etfs: previousEtfs, event: null, date: null };
  const moves = activeRows.map((row) => {
    const close = number(row.ClosingPrice);
    const change = number(row.Change);
    return close && Number.isFinite(change) ? change / (close - change) * 100 : NaN;
  }).filter(Number.isFinite);
  const up = moves.filter((move) => move > 0).length;
  const breadth = moves.length ? up / moves.length * 100 : 50;
  const etfs = activeRows.map((row) => ({
    code: String(row.Code),
    name: String(row.Name),
    scope: /美國/.test(row.Name) ? "US" : /全球|ARK|世界/.test(row.Name) ? "GLOBAL" : "TW",
  }));
  return {
    etfs,
    date: rocDate(activeRows[0]?.Date),
    event: {
      id: "active-etf-breadth",
      region: "TW",
      name: "主動 ETF 上漲家數比",
      actual: round(breadth, 1),
      expected: 50,
      previous: 50,
      unit: "%",
      releasedAt: new Date().toISOString(),
      fresh: true,
      kind: "breadth",
    },
  };
}

function rankData(stocks, histories) {
  const rows = stocks.map((stock) => ({ code: stock.code, name: stock.name, change: stock.flow20 }))
    .filter((row) => Number.isFinite(row.change));
  const dates = [...histories.values()].map((item) => item.date).sort();
  const starts = [...histories.values()].map((item) => item.startDate).sort();
  const date = dates.at(-1) ?? formatDate(new Date());
  const start = starts[0] ?? date;
  return {
    date,
    period: `${start.slice(5)}-${date.slice(5)}`,
    increases: [...rows].sort((a, b) => b.change - a.change).slice(0, 8),
    decreases: [...rows].sort((a, b) => a.change - b.change).slice(0, 8),
  };
}

async function main() {
  const [oldMacros, oldEtfs, oldStocks] = await Promise.all([
    readJson("macros.json"),
    readJson("etfs.json"),
    readJson("stocks.json"),
  ]);
  const fallback = new Map(oldMacros.map((event) => [event.id, event]));
  const series = ["CPIAUCSL", "CPILFESL", "PAYEMS", "DGS10", "VIXCLS", "DTWEXBGS"];
  const fredResults = await Promise.allSettled(series.map((id) => fred(id)));
  const rows = Object.fromEntries(series.map((id, index) => [id, fredResults[index].status === "fulfilled" ? fredResults[index].value : null]));
  series.forEach((id) => { if (!rows[id]) warnings.push(`FRED ${id} 沿用前次資料`); });

  let twseRows = [];
  try {
    twseRows = await fetchJson("https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL");
  } catch {
    warnings.push("臺灣證券交易所資料沿用前次資料");
  }
  const active = activeEtfData(twseRows, oldEtfs);
  const { stocks, histories } = await updateStocks(oldStocks, active.date);
  const macros = [
    rows.CPIAUCSL ? yoyEvent({ id: "us-cpi", name: "美國 CPI 年增率", rows: rows.CPIAUCSL }) : fallback.get("us-cpi"),
    rows.CPILFESL ? yoyEvent({ id: "us-core-cpi", name: "美國核心 CPI 年增率", rows: rows.CPILFESL }) : fallback.get("us-core-cpi"),
    rows.PAYEMS ? payrollEvent(rows.PAYEMS) : fallback.get("us-payrolls"),
    rows.DGS10 ? dailyEvent({ id: "us-yield", name: "美國 10 年期殖利率", kind: "yield", unit: "%", rows: rows.DGS10 }) : fallback.get("us-yield"),
    marketEvent(stocks, histories),
    active.event ?? fallback.get("active-etf-breadth"),
    rows.VIXCLS ? dailyEvent({ id: "vix", name: "VIX 波動率", kind: "vol", unit: "", rows: rows.VIXCLS, digits: 1 }) : fallback.get("vix"),
    rows.DTWEXBGS ? dailyEvent({ id: "dollar", name: "美元廣義指數", kind: "dollar", unit: "", rows: rows.DTWEXBGS, digits: 1 }) : fallback.get("dxy"),
  ].filter(Boolean);
  const rank = rankData(stocks, histories);
  const marketDate = active.date ?? rank.date;

  await Promise.all([
    writeJson("macros.json", macros),
    writeJson("stocks.json", stocks),
    writeJson("rank.json", rank),
    writeJson("etfs.json", active.etfs),
    writeJson("status.json", {
      updatedAt: new Date().toISOString(),
      marketDate,
      sources: ["臺灣證券交易所 OpenAPI", "FRED", "公開市場歷史報價"],
      warnings,
    }),
  ]);
  console.log(`Updated ${stocks.length} stocks, ${active.etfs.length} ETFs, ${macros.length} signals for ${marketDate}.`);
  if (warnings.length) console.warn(warnings.join("\n"));
}

await main();
