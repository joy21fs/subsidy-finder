"use client";

import { useTranslations } from "next-intl";
import type { SubsidyResult } from "@/lib/types";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function SubsidyResultCard({
  result,
  inputType,
  sourceUrl,
}: {
  result: SubsidyResult;
  inputType: "url" | "keywords";
  sourceUrl?: string;
}) {
  const t = useTranslations("ResultCard");

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(
    result.title + t("searchSuffix")
  )}`;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-100 bg-zinc-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">{result.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">{result.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
              {result.scope}
            </span>
            {result.amount && (
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">
                {result.amount}
              </span>
            )}
            {result.deadline && (
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                {result.deadline}
              </span>
            )}
          </div>
        </div>
        {inputType === "url" && sourceUrl && (
          <p className="mt-2 text-xs text-zinc-400">
            {t("sourceLabel")}
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {sourceUrl}
            </a>
          </p>
        )}
      </div>

      <div className="divide-y divide-zinc-100">
        <Section title={t("eligibility")}>
          <p className="mb-2 text-sm text-zinc-700">{result.eligibility.description}</p>
          <ul className="space-y-1">
            {result.eligibility.conditions.map((c, i) => (
              <li key={i} className="flex gap-2 text-sm text-zinc-700">
                <span className="mt-0.5 text-zinc-400">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t("documents")}>
          <ol className="space-y-1.5">
            {result.documents.map((doc, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="mt-0.5 min-w-5 font-medium text-zinc-400">
                  {i + 1}.
                </span>
                <span>
                  <span className="font-medium text-zinc-900">{doc.name}</span>
                  {doc.note && <span className="text-zinc-500"> — {doc.note}</span>}
                </span>
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t("steps")}>
          <ol className="space-y-2">
            {result.steps.map((step) => (
              <li key={step.order} className="flex gap-3 text-sm">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-medium text-white">
                  {step.order}
                </span>
                <span className="text-zinc-700">{step.description}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <div className="border-t border-amber-100 bg-amber-50 px-5 py-3">
        <p className="text-xs text-amber-800">{result.disclaimer}</p>
        <a
          href={inputType === "url" && sourceUrl ? sourceUrl : searchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1.5 inline-block text-xs text-blue-600 hover:underline"
        >
          {inputType === "url" ? t("viewSource") : t("searchOfficial")}
        </a>
      </div>
    </article>
  );
}
