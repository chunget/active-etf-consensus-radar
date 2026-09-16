export function PredictionSkeleton({ text }: { text: string }) {
  return (
    <div className="rounded-[10px] border border-[#3B3E45] bg-[#1F2024] p-4" role="status" aria-live="polite">
      <p className="text-sm font-semibold text-[#FFC83D]">{text}</p>
      <div className="mt-4 space-y-3">
        <span className="block h-3 w-3/4 animate-pulse rounded bg-[#3B3E45]" />
        <span className="block h-3 w-11/12 animate-pulse rounded bg-[#3B3E45]" />
        <span className="block h-3 w-2/3 animate-pulse rounded bg-[#3B3E45]" />
      </div>
    </div>
  );
}
