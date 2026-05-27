import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Ditari i Fermës — Aplikacioni për Bletarët Shqiptarë",
    template: "%s | Ditari i Fermës",
  },
  description:
    "Regjistro inspektimet e zgjojve, planifiko Detyrat dhe menaxho bletarinë tënde nga telefoni — edhe pa internet. Falas për bletarët shqiptarë.",
  keywords: ["bletari", "ditari", "fermë", "zgjoje", "mjaltë", "shqipëri", "bletarë"],
  manifest: "/manifest.json",
  openGraph: {
    title: "Ditari i Fermës — Aplikacioni për Bletarët Shqiptarë",
    description: "Menaxho bletarinë tënde nga telefoni. Regjistro inspektimet, merr kujtesa dhe mbaj shënim prodhimin e mjaltit.",
    locale: "sq_AL",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Ditari i Fermës",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="sq">
      <body className="bg-white text-gray-900 antialiased">
        <NextIntlClientProvider locale="sq" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
