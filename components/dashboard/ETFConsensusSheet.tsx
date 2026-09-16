"use client";

import { X } from "lucide-react";
import type { Etf, Prediction } from "./types";

export function ETFConsensusSheet({ etf, prediction, onClose }: { etf?: Etf; prediction: Prediction; onClose: () => void }) {
  const picks = etf ? prediction.etfPreferences[etf.code] ?? [] : [];
  return (
    <div className={etf ? "visible fixed inset-0 z-50" : "invisible fixed inset-0 z-50"} aria-hidden={!etf}>
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="關閉" />
      <aside className="absolute bottom-0 left-0 right-0 max-h-[78vh] overflow-y-auto rounded-t-[10px] border border-[#3B3E45] bg-[#1F2024] p-5 shadow-2xl md:left-auto md:top-0 md:h-full md:w-[420px] md:rounded-none">
        {etf && (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-[#939BAD]">反向查詢</p>
                <h2 className="text-xl font-bold">{etf.code}</h2>
                <p className="text-sm text-[#939BAD]">{etf.name}</p>
              </div>
              <button onClick={onClose} className="grid min-h-11 min-w-11 place-items-center rounded-[10px] border border-[#3B3E45]" aria-label="關閉"><X size={18} /></button>
            </div>
            <h3 className="mt-6 font-semibold">這位經理人接下來可能偏好哪些股票</h3>
            <div className="mt-3 space-y-2">
              {picks.map((item) => (
                <div key={item.code} className="flex min-h-11 items-center justify-between rounded-[10px] border border-[#3B3E45] bg-[#292A2E] p-3">
                  <span><b>{item.name}</b><span className="ml-2 text-[#939BAD]">{item.code}</span></span>
                  <span className="text-[#FFC83D]">{item.level}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
