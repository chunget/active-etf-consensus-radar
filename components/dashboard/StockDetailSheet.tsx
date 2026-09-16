"use client";

import { X } from "lucide-react";
import type { Prediction, RankedStock } from "./types";

export function StockDetailSheet({ stock, prediction, onClose, onEtf }: { stock?: RankedStock; prediction: Prediction; onClose: () => void; onEtf: (code: string) => void }) {
  const list = stock ? prediction.etfConsensus[stock.code] ?? [] : [];
  return (
    <div className={stock ? "visible fixed inset-0 z-50" : "invisible fixed inset-0 z-50"} aria-hidden={!stock}>
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="關閉" />
      <aside className="absolute bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-[10px] border border-[#3B3E45] bg-[#1F2024] p-5 shadow-2xl md:left-auto md:top-0 md:h-full md:w-[420px] md:rounded-none">
        {stock && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#939BAD]">個股共識推估</p>
                <h2 className="text-2xl font-bold">{stock.name} <span className="text-sm text-[#939BAD]">{stock.code}</span></h2>
              </div>
              <button onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-[10px] border border-[#3B3E45]" aria-label="關閉"><X size={18} /></button>
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
              <span className="rounded bg-[#292A2E] p-3">共識強度<b className="block text-xl text-[#FFC83D]">{stock.strength}</b></span>
              <span className="rounded bg-[#292A2E] p-3">檔數<b className="block text-xl">{stock.etfCount}</b></span>
              <span className="rounded bg-[#292A2E] p-3">今日變化<b className="block text-xl">{stock.trend === "up" ? "↑" : stock.trend === "down" ? "↓" : "→"}</b></span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">{stock.tags.map((tag) => <span key={tag} className="rounded-full bg-[#292A2E] px-3 py-1 text-xs text-[#FFC83D]">{tag}</span>)}</div>
            <h3 className="mt-6 font-semibold">哪些 ETF 可能靠近</h3>
            <div className="mt-3 space-y-2">
              {list.map((etf) => (
                <button key={etf.code} onClick={() => onEtf(etf.code)} className="flex min-h-11 w-full items-center justify-between rounded-[10px] border border-[#3B3E45] bg-[#292A2E] p-3 text-left">
                  <span><b>{etf.code}</b><span className="ml-2 text-[#939BAD]">{etf.name}</span></span>
                  <span className="text-[#FFC83D]">{etf.level}</span>
                </button>
              ))}
            </div>
            <p className="mt-5 text-xs leading-5 text-[#939BAD]">本頁為模型推估結果,不代表基金經理人實際交易。</p>
          </>
        )}
      </aside>
    </div>
  );
}
