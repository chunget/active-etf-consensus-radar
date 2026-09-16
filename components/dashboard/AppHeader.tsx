"use client";

import { Search } from "lucide-react";

export function AppHeader({ onSearch }: { onSearch: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#3B3E45] bg-[#303136]">
      <div className="mx-auto flex min-h-16 max-w-[1480px] items-center justify-between gap-3 px-4 sm:px-6">
        <nav className="flex items-center gap-2" aria-label="主選單">
          <button className="min-h-11 rounded-[10px] bg-[#FFC83D] px-4 text-sm font-bold text-[#121212]">主動式ETF</button>
        </nav>
        <button
          type="button"
          onClick={onSearch}
          className="flex min-h-11 min-w-11 items-center gap-2 rounded-[10px] border border-[#3B3E45] bg-[#1F2024] px-3 text-sm text-[#F5F5F5] hover:border-[#FFC83D]"
          aria-label="搜尋股票或 ETF"
        >
          <Search size={17} />
          <span className="hidden sm:inline">搜尋股票 / ETF</span>
        </button>
      </div>
    </header>
  );
}
