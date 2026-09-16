"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Etf, Prediction, RankedStock } from "./types";

export function SearchOverlay({ open, prediction, etfs, onClose, onStock, onEtf }: { open: boolean; prediction: Prediction; etfs: Etf[]; onClose: () => void; onStock: (stock: RankedStock) => void; onEtf: (etf: Etf) => void }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return [
      ...prediction.stockRanking.filter((s) => `${s.code} ${s.name}`.toLowerCase().includes(q)).map((s) => ({ type: "stock" as const, item: s })),
      ...etfs.filter((e) => `${e.code} ${e.name}`.toLowerCase().includes(q)).map((e) => ({ type: "etf" as const, item: e })),
    ].slice(0, 10);
  }, [query, prediction.stockRanking, etfs]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4">
      <div className="mx-auto mt-20 max-w-xl rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-[#939BAD]" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="輸入股票或 ETF 代號" className="min-h-11 flex-1 bg-transparent text-base outline-none" />
          <button onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-[10px] border border-[#3B3E45]" aria-label="關閉"><X size={18} /></button>
        </div>
        <div className="mt-4 space-y-2">
          {results.length === 0 ? <p className="rounded-[10px] bg-[#292A2E] p-4 text-sm text-[#939BAD]">輸入代號後可直接定位。沒有結果時可查看最新共識。</p> : results.map((result) => (
            <button
              key={`${result.type}-${result.item.code}`}
              onClick={() => { result.type === "stock" ? onStock(result.item as RankedStock) : onEtf(result.item as Etf); onClose(); }}
              className="flex min-h-11 w-full items-center justify-between rounded-[10px] border border-[#3B3E45] bg-[#292A2E] p-3 text-left"
            >
              <span><b>{result.item.code}</b><span className="ml-2 text-[#939BAD]">{result.item.name}</span></span>
              <span className="text-xs text-[#FFC83D]">{result.type === "stock" ? "股票" : "ETF"}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
