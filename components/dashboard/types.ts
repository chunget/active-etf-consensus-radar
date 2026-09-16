export type MacroEvent = {
  id: string;
  region: "US" | "TW" | "GLOBAL";
  name: string;
  actual: number;
  expected: number;
  previous: number;
  unit: string;
  fresh: boolean;
};

export type RankedStock = {
  rank: number;
  code: string;
  name: string;
  industry: string;
  tags: string[];
  strength: number;
  etfCount: number;
  etfTotal: number;
  etfCountDelta: number;
  trend: "up" | "flat" | "down";
  note?: string;
};

export type Prediction = {
  date: string;
  updatedAt: string;
  horizon: 1 | 3 | 5 | 10 | 20;
  usedEvents: MacroEvent[];
  etfTotal: number;
  regime: { label: string; tone: string; drivers: string[] };
  summary: string;
  stockRanking: RankedStock[];
  industryRanking: { name: string; strength: number; stocks: string[] }[];
  etfConsensus: Record<string, { code: string; name: string; level: string }[]>;
  etfPreferences: Record<string, { code: string; name: string; level: string }[]>;
  disagreements: { bullish: number; cautious: number; level: string };
  themes: { id: string; name: string; strength: number; stocks: RankedStock[] }[];
};

export type Etf = {
  code: string;
  name: string;
  scope: "US" | "TW" | "GLOBAL";
};
