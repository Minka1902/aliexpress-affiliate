import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export const locales = ["en", "he", "ru"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const rtlLocales: Locale[] = ["he"];

export function dirFor(locale: string): "rtl" | "ltr" {
  return rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("locale")?.value;
  const locale: Locale = locales.includes(cookieLocale as Locale)
    ? (cookieLocale as Locale)
    : defaultLocale;

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  return { locale, messages };
});
