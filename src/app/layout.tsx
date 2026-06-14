import type { Metadata } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { dirFor } from "@/lib/i18n/request";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "AffiLink — AliExpress Affiliate",
  description: "Turn any AliExpress link into your affiliate link",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};

const THEMES = ["aliexpress", "dark", "contrast"];

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value;
  const dataTheme = THEMES.includes(theme || "") ? theme : "aliexpress";

  return (
    <html lang={locale} dir={dirFor(locale)} data-theme={dataTheme}>
      <body className="min-h-screen">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ToastProvider>{children}</ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
