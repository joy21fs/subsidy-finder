import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => ({
  locale: "zh-TW",
  messages: (await import("../../messages/zh-TW.json")).default,
}));
