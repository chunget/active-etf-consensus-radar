"use client";

import { Scatter, ScatterChart, ResponsiveContainer, ZAxis, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import type { RankedStock } from "./types";

const groupY: Record<string, number> = { 半導體: 84, 散熱: 70, ASIC: 62, "AI Server": 55, 金融: 38, 能源電力: 28, AI晶片: 78, 雲端軟體: 46 };

export function ConsensusBubbleMap({ stocks, onPick }: { stocks: RankedStock[]; onPick: (stock: RankedStock) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const data = stocks.slice(0, 14).map((stock, index) => ({
    ...stock,
    x: 10 + (index % 5) * 20 + (index % 2) * 4,
    y: groupY[stock.industry] ?? 18 + (index % 6) * 10,
    z: 120 + stock.etfCount * 38,
  }));
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-[#939BAD]">共識泡泡圖</p>
          <h2 className="text-lg font-semibold">產業族群分群</h2>
        </div>
        <span className="text-xs text-[#939BAD]">大小代表可能共識 ETF 檔數</span>
      </div>
      <div className="h-[320px]">
        {mounted ? <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 4, bottom: 4, left: 4 }}>
            <ZAxis dataKey="z" range={[120, 980]} />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                const item = active && payload?.[0]?.payload;
                return item ? (
                  <div className="rounded-[10px] border border-[#3B3E45] bg-[#121212] p-3 text-sm shadow-xl">
                    <b>{item.name}</b>
                    <p className="text-[#939BAD]">共識強度 {item.strength} / {item.etfCount} 檔</p>
                    <p className={item.trend === "up" ? "text-[#E32B30]" : item.trend === "down" ? "text-[#38CDB0]" : "text-[#939BAD]"}>{item.trend === "up" ? "較昨日增加" : item.trend === "down" ? "較昨日降溫" : "較昨日持平"}</p>
                  </div>
                ) : null;
              }}
            />
            <Scatter data={data} fill="#FFC83D" onClick={(node) => node.payload && onPick(node.payload)} />
          </ScatterChart>
        </ResponsiveContainer> : <div className="h-full rounded-[10px] bg-[#292A2E]" />}
      </div>
    </section>
  );
}
