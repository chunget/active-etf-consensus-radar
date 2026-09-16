# Active ETF Consensus Radar

主動 ETF 經理人共識推演儀表板。使用總體事件、ETF 風格與市場資料的模擬樣本，呈現可能的產業偏好、個股共識強度與配置傾向。

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
