export function IndustryConsensus({ industries }: { industries: { name: string; strength: number; stocks: string[] }[] }) {
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <p className="text-xs text-[#939BAD]">產業資金雷達</p>
      <h2 className="text-lg font-semibold">Top 6</h2>
      <div className="mt-4 space-y-3">
        {industries.slice(0, 6).map((item) => (
          <div key={item.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{item.name}</span>
              <span className="tabular-nums text-[#FFC83D]">{item.strength}</span>
            </div>
            <div className="h-2 rounded bg-[#292A2E]">
              <div className="h-2 rounded bg-[#E32B30]" style={{ width: `${item.strength}%` }} />
            </div>
            <p className="mt-1 text-xs text-[#939BAD]">{item.stocks.join("、")}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
