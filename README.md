# Active ETF Consensus Radar

主動 ETF 經理人共識推演儀表板。使用每日更新的總體指標、ETF 清單與市場價格資料，呈現可能的產業偏好、個股共識強度與配置傾向。

> 本專案內容為模型推估與介面展示，不代表基金經理人實際交易，也不構成投資建議。

## Local development

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

## GitHub Pages

Pushes to `main` are built and published automatically by the workflow in `.github/workflows/deploy-pages.yml`.

```bash
npm run build:pages
```

The static export is written to `out/`. Prediction logic runs in the browser so all dashboard interactions remain available on GitHub Pages.

## Daily data refresh

The Pages workflow refreshes data and redeploys at 06:35 Asia/Taipei every weekday. It can also be run manually from GitHub Actions.

```bash
npm run update:data
```

The updater uses TWSE OpenAPI, FRED, and public market-price history. `data/status.json` records the latest refresh time, market date, sources, and any per-source fallback warnings.
