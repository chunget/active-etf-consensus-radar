export function DisagreementCard({ data }: { data: { bullish: number; cautious: number; level: string } }) {
  const total = Math.max(1, data.bullish + data.cautious);
  return (
    <section className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4">
      <p className="text-xs text-[#939BAD]">經理人分歧</p>
      <h2 className="text-lg font-semibold">分歧 {data.level}</h2>
      <div className="mt-4 overflow-hidden rounded-full border border-[#3B3E45] bg-[#292A2E]">
        <div className="flex h-4">
          <span className="bg-[#E32B30]" style={{ width: `${(data.bullish / total) * 100}%` }} />
          <span className="bg-[#38CDB0]" style={{ width: `${(data.cautious / total) * 100}%` }} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <span className="rounded bg-[#292A2E] p-3 text-[#E32B30]">多方傾向 {data.bullish} 檔</span>
        <span className="rounded bg-[#292A2E] p-3 text-[#38CDB0]">保守傾向 {data.cautious} 檔</span>
      </div>
    </section>
  );
}
