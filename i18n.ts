import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => ({
  locale: "sq",
  messages: (await import("./messages/sq.json")).default,
}));
