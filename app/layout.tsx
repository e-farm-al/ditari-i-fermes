import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ditari i Fermës",
  description: "Menaxhoni fermën tuaj nga telefoni — edhe pa internet.",
  manifest: "/manifest.json",
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
