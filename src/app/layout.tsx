import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { dirFor } from "@/lib/i18n/request";
import { ToastProvider } from "@/components/Toast";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

export const metadata: Metadata = {
  title: "AffiLink — AliExpress Affiliate",
  description: "Turn any AliExpress link into your affiliate link",
  manifest: "/manifest.webmanifest",
  applicationName: "AffiLink",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "AffiLink",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#E62E04",
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
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
