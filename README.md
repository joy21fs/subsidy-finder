# 台灣政府補助查詢

**website: https://subsidy-finder-seven.vercel.app/**

輸入補助關鍵字或貼上政府頁面網址，AI 即時整理申請資格、所需文件與申請流程。

## 功能

- **關鍵字查詢** — 輸入「失業補助」、「租屋補助」等關鍵字，Claude AI 回傳結構化資訊
- **URL 解析** — 貼上政府補助頁面，server-side fetch 擷取原始 HTML，AI 分析後輸出統一格式
- **縣市篩選** — 22 縣市選單，prompt 依地區動態調整，優先顯示地方方案
- **具體數字** — 金額、薪資門檻等均強制要求具體數值（NT$34,936），拒絕模糊描述
- **防幻覺連結** — 移除易幻覺的 `officialUrl` 欄位；URL 查詢顯示使用者提供的原始連結，關鍵字查詢導向 Google 搜尋
- **i18n** — 所有 UI 字串透過 next-intl 管理，語言切換不需改動元件

## 技術決策

**為什麼用 Vercel AI Gateway 而非直接呼叫 Anthropic SDK？**
Gateway 統一管理 API key、rate limiting，未來切換模型只需改 model ID，不需重寫程式。

**為什麼用 `generateText` + `Output.object` 而非 `generateObject`？**
Vercel AI SDK v6 已棄用 `generateObject`，現在統一用 `generateText` 搭配 `output` 設定，結果從 `generated.output` 取得。

**為什麼移除 `officialUrl` 欄位？**
早期版本讓 Claude 自行產生官方網址，但 LLM 高機率產生不存在的 URL。現在只在使用者主動提供 URL 時才顯示連結，關鍵字查詢改用 Google 搜尋。

## 技術棧

| 項目 | 選擇 |
|------|------|
| 框架 | Next.js 16 App Router |
| AI | Vercel AI SDK v6 + AI Gateway → Claude Sonnet 4.6 |
| 結構化輸出 | Zod schema + `Output.object` |
| 樣式 | Tailwind CSS v4 |
| 國際化 | next-intl v4 |
| 測試 | Vitest + React Testing Library |
