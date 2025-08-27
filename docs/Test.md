# OpenBB Feature Benchmark: Test Queries & Expected UX

A curated benchmark of natural-language test queries targeting all major OpenBB features. Each query includes the corresponding OpenBB CLI/Python call and the expected user experience (UX). Entries marked **[Pro]** require premium capabilities (e.g. Copilot, dashboards).

---

## 1. Core CLI & Settings

1. **Query:** “help”  
   **Call:** `openbb` or `help`  
   **Expected UX:** Top-level menu/commands visible; autocomplete suggestions, arrow/tab cycling, preferences respected.

2. **Query:** “set timezone to America/Los_Angeles and default to 50 rows”  
   **Call:** `settings timezone=America/Los_Angeles n_rows=50`  
   **Expected UX:** Confirmation message; subsequent tables reflect these settings.

3. **Query:** “what parameters can I pass to commands?”  
   **Call:** CLI help / docs  
   **Expected UX:** Cheatsheet of standard params like `symbol`, `provider`, `start/end`, `limit`; inline hints when typing.

4. **Query:** “save this routine to rerun daily at market open”  
   **Call:** Routine scripting/scheduling command  
   **Expected UX:** Routine saved with cron-like scheduling; visible in routines list.

---

## 2. Equity

5. **Query:** “quote for AAPL”  
   **Call:** `OBB.equity.price.quote("AAPL")`  
   **Expected UX:** Card with price, high/low, volume, timestamp; export option.

6. **Query:** “AAPL daily candles for the last 2 years”  
   **Call:** `OBB.equity.price.historical("AAPL", start=..., end=...)`  
   **Expected UX:** Table + interactive chart, zoom/pan, CSV export.

7. **Query:** “AAPL income statement TTM and last 3 fiscal years”  
   **Call:** `OBB.equity.fundamental.income("AAPL")`  
   **Expected UX:** Table with periods, TTM toggle, provider badge.

8. **Query:** “analyst price target and forward P/E for MSFT”  
   **Call:** `OBB.equity.estimates.price_target("MSFT")` + `...forward_pe("MSFT")`  
   **Expected UX:** KPIs + distribution (if available), provider noted.

9. **Query:** “latest earnings call transcript for NVDA; summarize key themes”  
   **Call:** `OBB.equity.fundamental.transcript("NVDA")`  
   **Expected UX:** Transcript viewer; optional AI summary panel; copyable text.

10. **Query:** “search equities with ‘robotics’ and market cap > $10B”  
    **Call:** `OBB.equity.search(query="robotics")` + filters  
    **Expected UX:** Screener-style table, sortable, filterable.

---

## 3. ETF

11. **Query:** “top sectors in SPY and its latest holdings date”  
    **Call:** `OBB.etf.sectors("SPY")` + `OBB.etf.holdings_date("SPY")`  
    **Expected UX:** Sector pie chart + table; holdings date displayed.

12. **Query:** “compare 1Y price performance for SPY, QQQ, IWM”  
    **Call:** `OBB.etf.price_performance(["SPY","QQQ","IWM"], period="1y")`  
    **Expected UX:** Relative return chart + table.

---

## 4. Options

13. **Query:** “option chain for AAPL next monthly expiry”  
    **Call:** `OBB.equity.options.chains("AAPL", expiration=...)`  
    **Expected UX:** Strike-Greeks table; filters; CSV export.

14. **Query:** “NVDA calls delta ≈ 0.3, expiry < 45 days”  
    **Call:** Chain fetch + filtering  
    **Expected UX:** Filter pane; detailed columns; export.

---

## 5. Crypto & DeFi

15. **Query:** “BTC and ETH quotes”  
    **Call:** `OBB.crypto.price.quote(["BTC-USD","ETH-USD"])`  
    **Expected UX:** Price cards with 24h change and sparkline.

16. **Query:** “BTC daily price since 2020-01-01, overlay halvings”  
    **Call:** `OBB.crypto.price.historical("BTC-USD", start="2020-01-01")` + overlay  
    **Expected UX:** Chart with event markers.

---

## 6. FX

17. **Query:** “EURUSD hourly candles last 5 days”  
    **Call:** `OBB.forex.price.historical("EURUSD", interval="1h", start=...)`  
    **Expected UX:** OHLC table + chart; correct timezone.

---

## 7. Macro / Economy

18. **Query:** “US unemployment rate and CPI YoY since 2000”  
    **Call:** `OBB.economy.unemployment("US")` + `OBB.economy.inflation("US")`  
    **Expected UX:** Dual chart; source labels (e.g. FRED).

19. **Query:** “economic calendar for this week: US & EU”  
    **Call:** `OBB.economy.calendar(countries=["US","EU"])`  
    **Expected UX:** Date-grouped agenda; importance badges.

---

## 8. Fixed Income

20. **Query:** “US 10Y yield last 5 years; show drawdown”  
    **Call:** `OBB.fixed_income.yields("US10Y", start=...)`  
    **Expected UX:** Yield chart + drawdown graph/table.

---

## 9. Screeners & Market Snapshots

21. **Query:** “equity screener: US, market cap > $5B, P/E < 20, 6M rel-strength > 0”  
    **Call:** `OBB.equity.screener(filters=...)`  
    **Expected UX:** Table, saveable view, export, drill-down links.

22. **Query:** “global market snapshot”  
    **Call:** `OBB.equity.market_snapshots()`  
    **Expected UX:** Region/index tiles, last updated timestamp.

---

## 10. News & Documents

23. **Query:** “news for AAPL today; summarize in 5 bullets”  
    **Call:** `OBB.equity.news("AAPL", start=today)` + summarizer  
    **Expected UX:** Headlines list + AI summary, preserved links.

24. **Query:** “download TSLA latest 10-K and extract risk factors”  
    **Call:** SEC filing fetch + parser  
    **Expected UX:** File saved; key section highlighted, copy-to-clipboard.

---

## 11. Portfolio

25. **Query:** “import my portfolio from CSV”  
    **Call:** Portfolio import CLI  
    **Expected UX:** Mapping interface; validation; inline error feedback.

26. **Query:** “compute daily P&L and performance vs SPY since 2024-01-01”  
    **Call:** Portfolio P&L vs benchmark  
    **Expected UX:** Equity curve vs SPY; P&L table; attribution.

27. **Query:** “factor exposure (Value, Momentum) for my portfolio”  
    **Call:** Portfolio factor analysis  
    **Expected UX:** Bar chart; methodology tooltip.

---

## 12. Comparative Analytics / Multi-Asset

28. **Query:** “compare revenue growth and forward EV/Sales: NVDA, AMD, AVGO”  
    **Call:** Fundamental comparison calls  
    **Expected UX:** KPI grid + small multiples chart.

29. **Query:** “rolling 90-day correlation BTC vs QQQ since 2021”  
    **Call:** Historical data + rolling correlation  
    **Expected UX:** Correlation line chart with tooltips; export.

---

## 13. Provider Selection & Provenance

30. **Query:** “re-run AAPL quote using provider=yfinance”  
    **Call:** `quote("AAPL", provider="yfinance")`  
    **Expected UX:** Result banner shows provider; differences flagged.

31. **Query:** “what providers for options chains?”  
    **Call:** CLI help or docs  
    **Expected UX:** Provider list (e.g., cboe, deribit, intrinio, tradier, etc.) with coverage matrix.

---

## 14. Export & Workspace

32. **Query:** “export this table to CSV and chart to PNG”  
    **Call:** Export commands  
    **Expected UX:** Filenames confirmed; file path output; open-in-folder option.

33. **Query:** “save dashboard layout as default workspace” **[Pro]**  
    **Call:** Save workspace command  
    **Expected UX:** Layout persists; sharable across users.

---

## 15. Quality-of-Life & Copilot (Pro)

34. **Query:** “summarize last NVDA earnings call into 5 bullets with quotes” **[Pro]**  
    **Call:** Transcript + Copilot summary  
    **Expected UX:** Bulleted summary with timestamps/citations.

35. **Query:** “create dashboard: AAPL quote, SPY holdings, US CPI, BTC price” **[Pro]**  
    **Call:** Dashboard assembly commands  
    **Expected UX:** Four widgets, refreshable, savable as workspace.

---

## 16. Smoke-Test Flows

36. **Flow:** “Deep-dive AAPL: 3Y price, fundamentals, consensus, transcript summary, news”  
    **Call:** `price.historical` → `fundamentals.*` → `estimates.*` → `transcript` → `news`  
    **Expected UX:** Unified report with sections, charts, summaries; export to PDF/Markdown.

37. **Flow:** “Options sizing: AAPL delta 0.30-0.35 calls with tight spreads; show IV, theoretical vs mark”  
    **Call:** Chains + filters + fields  
    **Expected UX:** Ranked chain table; greeks complete; export.

38. **Flow:** “US macro snapshot: unemployment, CPI, rates, BoP, calendar this week”  
    **Call:** `economy.*` + `economy.calendar`  
    **Expected UX:** Multi-panel display with latest data, source labels.

---

##  Notes for Benchmark Harness

- **Autocomplete & Help** must offer suggestions immediately after typing space.
- **Settings** (e.g., timezone, rows) must persist and influence outputs.
- **Standardized Parameters** should be uniform; provider routing visible.
- Coverage must span **Equity, Options, Crypto, FX, Macro, Fixed Income**.
- Flag **[Pro]** tests when premium features are required.

---

*All referenced feature coverage and behavior expectations are based on OpenBB’s official documentation and architecture.*  
