import etfs from "@/data/etfs.json";
import macros from "@/data/macros.json";
import rank from "@/data/rank.json";
import stocks from "@/data/stocks.json";
import themes from "@/data/themes.json";
import type { Etf, MacroEvent, Stock } from "./types";

export interface MacroProvider {
  list(): Promise<MacroEvent[]>;
}

export interface ETFProvider {
  list(): Promise<Etf[]>;
}

export interface MarketProvider {
  stocks(): Promise<Stock[]>;
  themes(): Promise<typeof themes>;
  rank(): Promise<typeof rank>;
}

export const macroProvider: MacroProvider = {
  async list() {
    return macros as MacroEvent[];
  },
};

export const etfProvider: ETFProvider = {
  async list() {
    return etfs as Etf[];
  },
};

export const marketProvider: MarketProvider = {
  async stocks() {
    return stocks as Stock[];
  },
  async themes() {
    return themes;
  },
  async rank() {
    return rank;
  },
};
