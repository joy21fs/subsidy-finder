"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SubsidyResultCard } from "@/components/subsidy-result-card";
import type { SubsidyResponse } from "@/lib/types";

const URL_RE = /^https?:\/\//i;

function LoadingSkeleton() {
  const t = useTranslations("ResultCard");
  const sections = [t("eligibility"), t("documents"), t("steps")];

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
      <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
        <div className="h-5 w-48 animate-pulse rounded-md bg-zinc-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded-md bg-zinc-200" />
      </div>
      <div className="divide-y divide-zinc-100">
        {sections.map((label) => (
          <div key={label} className="px-5 py-4">
            <div className="mb-3 h-3 w-16 animate-pulse rounded bg-zinc-200" />
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-4 animate-pulse rounded bg-zinc-100"
                  style={{ width: `${70 + i * 10}%` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const t = useTranslations("HomePage");
  const counties = t.raw("counties") as string[];
  const examples = t.raw("examples") as string[];

  const [input, setInput] = useState("");
  const [county, setCounty] = useState<string>(counties[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubsidyResponse | null>(null);

  const isUrl = URL_RE.test(input.trim());

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/subsidy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim(), county }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? t("errorUnknown"));
        return;
      }

      setResult(data as SubsidyResponse);
    } catch {
      setError(t("errorNetwork"));
    } finally {
      setLoading(false);
    }
  }

  function handleExample(kw: string) {
    setInput(kw);
    setError(null);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("heading")}
          </h1>
          <p className="mt-2 text-sm text-zinc-500">{t("subheading")}</p>
        </div>

        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <label htmlFor="county" className="text-xs text-zinc-500 shrink-0">
              {t("countyLabel")}
            </label>
            <select
              id="county"
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
            >
              {counties.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {county !== counties[0] && (
              <span className="text-xs text-zinc-400">
                {t("countyHint", { county })}
              </span>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-zinc-900/10">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError(null);
              }}
              rows={3}
              placeholder={t("inputPlaceholder")}
              className="w-full resize-none bg-transparent px-4 py-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            />
            <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-2">
              <span className="text-xs text-zinc-400">
                {input.trim()
                  ? isUrl
                    ? t("inputHintUrl")
                    : t("inputHintKeyword")
                  : t("inputHintDefault")}
              </span>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="inline-flex h-8 items-center rounded-xl bg-zinc-900 px-4 text-xs font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? t("submitLoading") : t("submitButton")}
              </button>
            </div>
          </div>
        </form>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-400">{t("quickSearchLabel")}</span>
          {examples.map((kw) => (
            <button
              key={kw}
              onClick={() => handleExample(kw)}
              type="button"
              className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
            >
              {kw}
            </button>
          ))}
        </div>

        {loading && <LoadingSkeleton />}

        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && !loading && (
          <SubsidyResultCard
            result={result.result}
            inputType={result.inputType}
            sourceUrl={result.sourceUrl}
          />
        )}

        {!loading && !result && !error && (
          <div className="py-12 text-center text-sm text-zinc-400">
            {t("emptyState")}
          </div>
        )}
      </div>
    </div>
  );
}
