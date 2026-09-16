import { Info } from "lucide-react";
import type { Prediction } from "./types";

export function MarketRegimeCard({ prediction, pendingCount, appliedCount }: { prediction: Prediction; pendingCount: number; appliedCount: number }) {
  const toneClass = prediction.regime.label === "Risk-On" ? "text-[#E32B30]" : prediction.regime.label === "Risk-Off" ? "text-[#38CDB0]" : "text-[#FFC83D]";
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#939BAD]">今天主動 ETF 經理人可能正在看什麼?</p>
          <h1 className="mt-1 max-w-2xl text-2xl font-bold tracking-tight text-[#F5F5F5] sm:text-3xl">模型推演共同配置傾向</h1>
        </div>
        <span className={`rounded-full border border-[#3B3E45] px-3 py-1 text-sm font-semibold ${toneClass}`}>{prediction.regime.label}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#C7CBD4]">依已套用總經事件推估，主動 ETF 可能形成共識強度較高的產業與個股方向。</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#939BAD]">
        {prediction.regime.drivers.map((driver) => <span key={driver} className="rounded-full bg-[#292A2E] px-3 py-1">{driver}</span>)}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#3B3E45] bg-[#292A2E] p-3 text-xs leading-5 text-[#939BAD]">
        <Info size={16} className="mt-0.5 shrink-0 text-[#FFC83D]" />
        <span>本頁為模型推估結果,不代表基金經理人實際交易。目前以 {appliedCount} 個事件推演{pendingCount > 0 ? `，已選 ${pendingCount} 個尚未套用` : "。"} </span>
      </div>
    </section>
  );
}
