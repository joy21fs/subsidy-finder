import { createGateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { SubsidyResponse } from "@/lib/types";

const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });

const RequestSchema = z.object({
  input: z.string().min(1, "請輸入關鍵字或網址").max(2000),
  county: z.string().optional(),
});

const SubsidyResultSchema = z.object({
  title: z.string(),
  summary: z.string(),
  scope: z.string(),
  eligibility: z.object({
    description: z.string(),
    conditions: z.array(z.string()),
  }),
  documents: z.array(
    z.object({
      name: z.string(),
      note: z.string().optional(),
    })
  ),
  steps: z.array(
    z.object({
      order: z.number().int().positive(),
      description: z.string(),
    })
  ),
  amount: z.string().optional(),
  deadline: z.string().optional(),
  disclaimer: z.string(),
});

const URL_RE = /^https?:\/\//i;
const MAX_CONTENT = 12_000;

const SYSTEM_PROMPT = `你是一位專業的台灣政府補助資訊助理。請分析補助相關資訊並輸出結構化資料，所有文字欄位請使用繁體中文。

規則：
- scope 欄位說明補助的適用範圍，例如「全國」、「台北市」、「各縣市不同」
- eligibility.conditions 列出具體可操作的申請條件（每條一項）
- documents 列出每份文件的明確名稱
- steps 依申請順序編號，每步驟說明清楚
- 若資訊不明確，在該欄位寫「資訊不明確，請洽主管機關確認」
- disclaimer 必須包含：「本資訊僅供參考，實際申請條件及金額請以官方公告為準。」

數字與金額規則（最重要）：
- 凡涉及金額、薪資門檻、補助上限、期限天數等數字，**必須寫出具體數字**，禁止使用模糊描述
- 正確範例：「每月補助最高 NT$8,000」、「月薪不超過 NT$34,936」、「可領最多 6 個月」
- 錯誤範例：「符合低收入條件」、「一定金額補助」、「數個月」
- amount 欄位必須包含具體金額數字與單位（如「每月最高 NT$8,000，最長補助 6 個月」）
- 若來源未提供具體數字，則在該條件後加註「（實際金額請洽主管機關）」`;

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchUrlContent(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; SubsidyBot/1.0)",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "zh-TW,zh;q=0.9",
    },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const html = await res.text();
  const text = stripHtml(html);

  if (text.length < 100) {
    throw new Error("頁面內容過少，可能是需要 JavaScript 渲染的網站");
  }

  return text.slice(0, MAX_CONTENT);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: "無效的請求格式" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.message ?? "輸入無效" },
      { status: 400 }
    );
  }

  const { input, county } = parsed.data;
  const isUrl = URL_RE.test(input.trim());
  const hasCounty = county && county !== "全台灣";

  let prompt: string;
  let sourceUrl: string | undefined;

  if (isUrl) {
    sourceUrl = input.trim();
    let pageContent: string;
    try {
      pageContent = await fetchUrlContent(sourceUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知錯誤";
      return NextResponse.json(
        {
          message: `無法取得網頁內容：${msg}。請確認網址是否正確，或直接輸入關鍵字查詢。`,
        },
        { status: 422 }
      );
    }

    prompt = `請從以下政府補助頁面內容中，萃取結構化的補助申請資訊。${hasCounty ? `使用者位於${county}，請特別標注哪些條件或金額因縣市而異。` : ""}

網址：${sourceUrl}

頁面內容：
${pageContent}`;
  } else {
    if (hasCounty) {
      prompt = `請提供台灣政府以下補助在「${county}」的詳細申請資訊。

查詢關鍵字：${input}

請說明：
1. 全國性補助方案（如有）的條件與金額
2. ${county}地方補助方案（如有）的條件與金額
若兩者均有，以最有利於${county}居民的內容為主，並在 scope 欄位說明適用範圍。`;
    } else {
      prompt = `請提供台灣政府以下補助的詳細申請資訊。若全國與各縣市條件不同，請在 scope 欄位說明「各縣市不同」並以常見條件為主。

查詢關鍵字：${input}`;
    }
  }

  try {
    const generated = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
      output: Output.object({ schema: SubsidyResultSchema }),
      system: SYSTEM_PROMPT,
      prompt,
    });

    return NextResponse.json({
      result: generated.output,
      inputType: isUrl ? "url" : "keywords",
      sourceUrl,
    } satisfies SubsidyResponse);
  } catch (err) {
    console.error("[/api/subsidy]", err);
    return NextResponse.json(
      { message: "分析補助資訊時發生錯誤，請稍後再試。" },
      { status: 500 }
    );
  }
}
