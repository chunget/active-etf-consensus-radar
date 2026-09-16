export type Region = "US" | "TW" | "GLOBAL";
export type Horizon = 1 | 3 | 5 | 10 | 20;
export type Level = "高" | "中高" | "中" | "低";

export type MacroEvent = {
  id: string;
  region: Region;
  name: string;
  actual: number;
  expected: number;
  previous: number;
  unit: string;
  releasedAt: string;
  fresh: boolean;
  kind: string;
};

export type Etf = {
  code: string;
  name: string;
  scope: Region;
};

export type Stock = {
  code: string;
  name: string;
  market: "TW" | "US";
  industry: string;
  themes: string[];
  size: "mid" | "large" | "mega";
  prior: number;
  flow1: number;
  flow20: number;
  valueTilt: number;
};

export type PredictionRequest = {
  date?: string;
  selectedEvents: string[];
  forecastHorizon: Horizon;
  themeId?: string;
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
