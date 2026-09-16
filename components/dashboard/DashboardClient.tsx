"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState, useTransition } from "react";
import { predict } from "@/lib/predict";
import { AppHeader } from "./AppHeader";
import { ConsensusBubbleMap } from "./ConsensusBubbleMap";
import { ConsensusRanking } from "./ConsensusRanking";
import { DisagreementCard } from "./DisagreementCard";
import { ETFConsensusSheet } from "./ETFConsensusSheet";
import { horizons, nowLabel } from "./format";
import { IndustryConsensus } from "./IndustryConsensus";
import { MacroEventSelector } from "./MacroEventSelector";
import { MarketRegimeCard } from "./MarketRegimeCard";
import { SearchOverlay } from "./SearchOverlay";
import { PredictionSkeleton } from "./Skeletons";
import { StockDetailSheet } from "./StockDetailSheet";
import type { Etf, MacroEvent, Prediction, RankedStock } from "./types";

type RankData = {
  date: string;
  period: string;
  increases: { code: string; name: string; change: number }[];
  decreases: { code: string; name: string; change: number }[];
};

const steps = ["正在重新推演…", "正在比對投資風格…", "正在尋找共同配置方向…"];

export function DashboardClient({ initialPrediction, macros, etfs, rank }: { initialPrediction: Prediction; macros: MacroEvent[]; etfs: Etf[]; rank: RankData }) {
  const [tab, setTab] = useState("經理人共識");
  const [prediction, setPrediction] = useState(initialPrediction);
  const [rankMode, setRankMode] = useState<"increases" | "decreases">("increases");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(initialPrediction.usedEvents.map((event) => event.id));
  const [appliedEvents, setAppliedEvents] = useState<string[]>(initialPrediction.usedEvents.map((event) => event.id));
  const [region, setRegion] = useState<"ALL" | "US" | "TW">("ALL");
  const [horizon, setHorizon] = useState<1 | 3 | 5 | 10 | 20>(initialPrediction.horizon);
  const [expanded, setExpanded] = useState(false);
  const [pickedStock, setPickedStock] = useState<RankedStock | undefined>();
  const [pickedEtf, setPickedEtf] = useState<Etf | undefined>();
  const [searchOpen, setSearchOpen] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [, startTransition] = useTransition();

  const pendingCount = useMemo(() => {
    const selected = selectedEvents.slice().sort().join(",");
    const applied = appliedEvents.slice().sort().join(",");
    return selected === applied ? 0 : selectedEvents.length;
  }, [selectedEvents, appliedEvents]);

  async function runPredict(nextEvents = selectedEvents, nextHorizon = horizon, themeId?: string) {
    setAppliedEvents(nextEvents);
    for (const step of steps) {
      setStatusText(step);
      await new Promise((resolve) => setTimeout(resolve, 560));
    }
    const next = await predict({
      date: "2026-09-16",
      selectedEvents: nextEvents,
      forecastHorizon: nextHorizon,
      themeId,
    });
    startTransition(() => setPrediction(next));
    setStatusText(`找到 ${next.stockRanking.filter((stock: RankedStock) => stock.strength >= 70).length} 個高共識方向`);
    window.setTimeout(() => setStatusText(""), 1200);
  }

  function updateHorizon(index: number) {
    const next = horizons[index] ?? 5;
    setHorizon(next);
    runPredict(appliedEvents, next);
  }

  const increaseMax = Math.max(...rank.increases.map((row) => Math.abs(row.change)));
  const decreaseMax = Math.max(...rank.decreases.map((row) => Math.abs(row.change)));
  const activeRankRows = rankMode === "increases" ? rank.increases : rank.decreases;
  const activeRankMax = rankMode === "increases" ? increaseMax : decreaseMax;

  return (
    <main className="min-h-screen bg-[#121212] text-[#F5F5F5]">
      <AppHeader onSearch={() => setSearchOpen(true)} />
      <div className="mx-auto max-w-[1480px] px-4 py-4 sm:px-6">
        <div className="mb-4 flex gap-2 overflow-x-auto">
          {["加減碼排行榜", "主題觀點", "經理人共識"].map((item) => (
            <button key={item} onClick={() => setTab(item)} className={`min-h-11 rounded-[10px] border px-3 text-sm ${tab === item ? "border-[#FFC83D] text-[#FFC83D]" : "border-[#3B3E45] text-[#939BAD]"}`}>
              {item}
            </button>
          ))}
        </div>

        {tab === "經理人共識" && (
          <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
            <aside className="xl:sticky xl:top-32 xl:self-start">
              <MacroEventSelector
                events={macros}
                selected={selectedEvents}
                applied={appliedEvents.length}
                region={region}
                onRegion={setRegion}
                onToggle={(id) => setSelectedEvents((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id])}
                onApplyAll={() => {
                  const ids = macros.map((event) => event.id);
                  setSelectedEvents(ids);
                  runPredict(ids, horizon);
                }}
                onClear={() => setSelectedEvents([])}
              />
            </aside>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#939BAD]">
                <span>即時連線中 / 更新時間 {nowLabel(prediction.updatedAt)}</span>
                <span>目前套用事件: {prediction.usedEvents.map((event) => event.name).join("、")}</span>
              </div>
              <MarketRegimeCard prediction={prediction} pendingCount={pendingCount} appliedCount={appliedEvents.length} />
              <div className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button onClick={() => runPredict(selectedEvents, horizon)} className="min-h-11 rounded-[10px] bg-[#FFC83D] px-5 text-sm font-bold text-[#121212]">解讀今日開獎</button>
                  <p className="text-sm text-[#939BAD]">{pendingCount > 0 ? `已選 ${pendingCount} 個尚未套用` : `目前以 ${appliedEvents.length} 個事件推演`}</p>
                </div>
                {statusText && <div className="mt-4"><PredictionSkeleton text={statusText} /></div>}
              </div>
              <div className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
                <p className="text-xs text-[#939BAD]">今天經理人在想什麼</p>
                <p className="mt-2 text-base leading-7">{prediction.summary}</p>
              </div>
              <div className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#939BAD]">推演天期</span>
                  <span className="text-lg font-bold text-[#FFC83D]">{horizon} 日</span>
                </div>
                <input aria-label="推演天期" type="range" min={0} max={4} step={1} value={horizons.indexOf(horizon)} onChange={(event) => updateHorizon(Number(event.target.value))} className="mt-4 w-full accent-[#FFC83D]" />
                <div className="mt-2 flex justify-between text-xs text-[#939BAD]">{horizons.map((item) => <span key={item}>{item}日</span>)}</div>
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={`${horizon}-${prediction.updatedAt}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }} className="space-y-4">
                  <ConsensusBubbleMap stocks={prediction.stockRanking} onPick={setPickedStock} />
                  <ConsensusRanking stocks={prediction.stockRanking} expanded={expanded} onExpand={() => setExpanded((value) => !value)} onPick={setPickedStock} />
                </motion.div>
              </AnimatePresence>
            </section>

            <aside className="space-y-4 xl:sticky xl:top-32 xl:self-start">
              <IndustryConsensus industries={prediction.industryRanking} />
              <DisagreementCard data={prediction.disagreements} />
            </aside>
          </div>
        )}

        {tab === "加減碼排行榜" && (
          <section className="mx-auto max-w-3xl rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
            <h1 className="text-center text-2xl font-bold">加減碼排行榜</h1>
            <p className="mt-1 text-center text-[#FFC83D]">{rank.date}（{rank.period}）</p>
            <div className="mx-auto mt-4 grid max-w-xs grid-cols-2 gap-2">
              <button onClick={() => setRankMode("increases")} className={`min-h-11 rounded-[10px] border text-sm ${rankMode === "increases" ? "border-[#E32B30] text-[#E32B30]" : "border-[#3B3E45] text-[#939BAD]"}`}>加碼</button>
              <button onClick={() => setRankMode("decreases")} className={`min-h-11 rounded-[10px] border text-sm ${rankMode === "decreases" ? "border-[#38CDB0] text-[#38CDB0]" : "border-[#3B3E45] text-[#939BAD]"}`}>減碼</button>
            </div>
            <div className="mt-5 space-y-3">
              {activeRankRows.map((row) => (
                <div key={`${row.code}-${row.name}`}>
                  <div className="mb-1 grid grid-cols-[80px_1fr_72px] gap-2 text-sm">
                    <span className="tabular-nums text-[#939BAD]">{row.code || "境外"}</span>
                    <span>{row.name}</span>
                    <span className={rankMode === "increases" ? "text-[#E32B30]" : "text-[#38CDB0]"}>{row.change > 0 ? "+" : ""}{row.change}%</span>
                  </div>
                  <div className="h-2 rounded bg-[#292A2E]"><div className={`h-2 rounded ${rankMode === "increases" ? "bg-[#E32B30]" : "bg-[#38CDB0]"}`} style={{ width: `${Math.abs(row.change) / activeRankMax * 100}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#939BAD]">此頁為已公布籌碼資料，與共識推演分開呈現；不提供投資建議或目標價。</p>
          </section>
        )}

        {tab === "主題觀點" && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {prediction.themes.map((theme) => (
              <button key={theme.id} onClick={() => runPredict(appliedEvents, horizon, theme.id)} className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4 text-left hover:border-[#FFC83D]">
                <span className="text-sm text-[#939BAD]">資金故事</span>
                <h2 className="mt-1 text-xl font-bold">{theme.name}</h2>
                <p className="mt-3 text-sm text-[#FFC83D]">族群平均共識強度 {theme.strength}</p>
                <p className="mt-2 text-sm text-[#939BAD]">{theme.stocks.map((stock) => stock.name).join("、") || "等待更多推估結果"}</p>
              </button>
            ))}
          </section>
        )}
      </div>
      <footer className="mx-auto max-w-[1480px] px-4 pb-8 text-xs leading-5 text-[#939BAD] sm:px-6">本頁為模型推估結果,不代表基金經理人實際交易。</footer>
      <StockDetailSheet stock={pickedStock} prediction={prediction} onClose={() => setPickedStock(undefined)} onEtf={(code) => setPickedEtf(etfs.find((etf) => etf.code === code))} />
      <ETFConsensusSheet etf={pickedEtf} prediction={prediction} onClose={() => setPickedEtf(undefined)} />
      <SearchOverlay open={searchOpen} prediction={prediction} etfs={etfs} onClose={() => setSearchOpen(false)} onStock={setPickedStock} onEtf={setPickedEtf} />
    </main>
  );
}
