"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { trendMark } from "./format";
import type { RankedStock } from "./types";

export function ConsensusRanking({ stocks, expanded, onExpand, onPick }: { stocks: RankedStock[]; expanded: boolean; onExpand: () => void; onPick: (stock: RankedStock) => void }) {
  const visible = expanded ? stocks.slice(0, 20) : stocks.slice(0, 10);
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#939BAD]">共同佈局候選</p>
          <h2 className="text-lg font-semibold">Top {visible.length}</h2>
        </div>
        <button onClick={onExpand} className="flex min-h-11 items-center gap-1 rounded-[10px] border border-[#3B3E45] px-3 text-sm text-[#F5F5F5]">
          {expanded ? "收合" : "展開 20"} <ChevronDown size={16} />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((stock) => (
            <motion.button
              layout
              key={stock.code}
              onClick={() => onPick(stock)}
              className="grid w-full grid-cols-[32px_1fr_auto] items-center gap-3 rounded-[10px] border border-[#3B3E45] bg-[#292A2E] p-3 text-left hover:border-[#FFC83D]"
              transition={{ duration: 0.28 }}
            >
              <span className="text-sm tabular-nums text-[#FFC83D]">{stock.rank}</span>
              <span>
                <span className="block font-semibold">{stock.name} <span className="text-xs text-[#939BAD]">{stock.code}</span></span>
                <span className="mt-1 flex flex-wrap gap-1">
                  {[stock.industry, ...stock.tags.slice(0, 2)].map((tag) => <span key={tag} className="rounded bg-[#1F2024] px-2 py-0.5 text-[11px] text-[#939BAD]">{tag}</span>)}
                </span>
                {stock.note && <span className="mt-1 block text-xs text-[#FFC83D]">{stock.note}</span>}
              </span>
              <span className="text-right tabular-nums">
                <b className="block text-lg text-[#F5F5F5]">{stock.strength}</b>
                <small className={stock.trend === "up" ? "text-[#E32B30]" : stock.trend === "down" ? "text-[#38CDB0]" : "text-[#939BAD]"}>{trendMark(stock.trend, stock.etfCountDelta)}</small>
                <small className="block text-[#939BAD]">{stock.etfCount}/{stock.etfTotal} 檔</small>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
