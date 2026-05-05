export type SubsidyDocument = {
  name: string;
  note?: string;
};

export type SubsidyStep = {
  order: number;
  description: string;
};

export type SubsidyResult = {
  title: string;
  summary: string;
  scope: string;
  eligibility: {
    description: string;
    conditions: string[];
  };
  documents: SubsidyDocument[];
  steps: SubsidyStep[];
  amount?: string;
  deadline?: string;
  disclaimer: string;
};

export type SubsidyResponse = {
  result: SubsidyResult;
  inputType: "url" | "keywords";
  sourceUrl?: string;
};
