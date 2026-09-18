"use client";

import { Check, RotateCcw, Zap } from "lucide-react";
import { eventRead } from "./format";
import type { MacroEvent } from "./types";

export function MacroEventSelector({
  events,
  selected,
  applied,
  region,
  onRegion,
  onToggle,
  onApplyAll,
  onClear,
}: {
  events: MacroEvent[];
  selected: string[];
  applied: number;
  region: "ALL" | "US" | "TW";
  onRegion: (region: "ALL" | "US" | "TW") => void;
  onToggle: (id: string) => void;
  onApplyAll: () => void;
  onClear: () => void;
}) {
  const filtered = events.filter((event) => region === "ALL" || event.region === region);
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-[#939BAD]">今日總經開獎</p>
          <h2 className="mt-1 text-base font-semibold">目前使用 {applied} 個事件推演</h2>
        </div>
        <span className="rounded-full border border-[#3B3E45] px-2 py-1 text-xs text-[#FFC83D]">每日更新</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {(["ALL", "US", "TW"] as const).map((item) => (
          <button
            key={item}
            onClick={() => onRegion(item)}
            className={`min-h-11 rounded-[10px] border text-sm ${region === item ? "border-[#FFC83D] text-[#FFC83D]" : "border-[#3B3E45] text-[#939BAD]"}`}
          >
            {item === "ALL" ? "全部" : item === "US" ? "美國" : "台灣"}
          </button>
        ))}
      </div>
      <div className="mt-4 max-h-[52vh] space-y-3 overflow-y-auto pr-1">
        {filtered.map((event) => {
          const active = selected.includes(event.id);
          return (
            <button
              key={event.id}
              onClick={() => onToggle(event.id)}
              className={`w-full rounded-[10px] border p-3 text-left transition-colors ${active ? "border-[#FFC83D] bg-[#292A2E]" : "border-[#3B3E45] bg-[#17181B] hover:border-[#939BAD]"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">{event.name}</span>
                <span className="flex items-center gap-2">
                  {event.fresh && <span className="rounded bg-[#E32B30] px-1.5 py-0.5 text-[11px] font-bold">NEW</span>}
                  {active && <Check size={16} className="text-[#FFC83D]" />}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#939BAD] tabular-nums">
                <span>實際 <b className="block text-[#F5F5F5]">{event.actual}{event.unit}</b></span>
                <span>模型基準 <b className="block text-[#F5F5F5]">{event.expected}{event.unit}</b></span>
                <span>前值 <b className="block text-[#F5F5F5]">{event.previous}{event.unit}</b></span>
              </div>
              <p className="mt-2 text-xs text-[#FFC83D]">{eventRead(event.actual, event.expected)}</p>
            </button>
          );
        })}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={onApplyAll} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-[#FFC83D] text-sm font-bold text-[#121212]"><Zap size={16} />全部套用</button>
        <button onClick={onClear} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#3B3E45] text-sm text-[#F5F5F5]"><RotateCcw size={16} />清除</button>
      </div>
    </section>
  );
}
