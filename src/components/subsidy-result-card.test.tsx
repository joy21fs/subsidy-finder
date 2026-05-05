import { render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { describe, it, expect } from "vitest";
import { SubsidyResultCard } from "./subsidy-result-card";
import messages from "../../messages/zh-TW.json";

const mockResult = {
  title: "失業給付",
  summary: "提供失業者基本生活保障",
  scope: "全台灣",
  eligibility: {
    description: "符合以下條件者可申請",
    conditions: ["非自願離職", "已辦理求職登記"],
  },
  documents: [{ name: "離職證明書", note: "須為雇主開立" }],
  steps: [{ order: 1, description: "至公立就業服務機構辦理求職登記" }],
  amount: "NT$18,780/月，最長6個月",
  deadline: "離職後30日內申請",
  disclaimer: "本資訊僅供參考，請以勞動部官方公告為準",
};

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="zh-TW" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  );
}

describe("SubsidyResultCard", () => {
  it("renders title and summary", () => {
    renderWithIntl(<SubsidyResultCard result={mockResult} inputType="keywords" />);
    expect(screen.getByText("失業給付")).toBeInTheDocument();
    expect(screen.getByText("提供失業者基本生活保障")).toBeInTheDocument();
  });

  it("renders amount and deadline badges", () => {
    renderWithIntl(<SubsidyResultCard result={mockResult} inputType="keywords" />);
    expect(screen.getByText("NT$18,780/月，最長6個月")).toBeInTheDocument();
    expect(screen.getByText("離職後30日內申請")).toBeInTheDocument();
  });

  it("renders eligibility conditions", () => {
    renderWithIntl(<SubsidyResultCard result={mockResult} inputType="keywords" />);
    expect(screen.getByText("非自願離職")).toBeInTheDocument();
    expect(screen.getByText("已辦理求職登記")).toBeInTheDocument();
  });

  it("renders document name and note", () => {
    renderWithIntl(<SubsidyResultCard result={mockResult} inputType="keywords" />);
    expect(screen.getByText("離職證明書")).toBeInTheDocument();
    expect(screen.getByText(/須為雇主開立/)).toBeInTheDocument();
  });

  it("links to Google search for keyword input", () => {
    renderWithIntl(<SubsidyResultCard result={mockResult} inputType="keywords" />);
    const link = screen.getByRole("link", { name: "搜尋官方資訊 →" });
    expect(link).toHaveAttribute("href", expect.stringContaining("google.com/search"));
    expect(link).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("失業給付")));
  });

  it("links to source URL for URL input", () => {
    const sourceUrl = "https://www.bli.gov.tw/example";
    renderWithIntl(
      <SubsidyResultCard result={mockResult} inputType="url" sourceUrl={sourceUrl} />
    );
    const footerLink = screen.getByRole("link", { name: "查看原始頁面 →" });
    expect(footerLink).toHaveAttribute("href", sourceUrl);
  });

  it("shows source label with URL when inputType is url", () => {
    const sourceUrl = "https://www.bli.gov.tw/example";
    renderWithIntl(
      <SubsidyResultCard result={mockResult} inputType="url" sourceUrl={sourceUrl} />
    );
    expect(screen.getByText(sourceUrl)).toBeInTheDocument();
  });
});
