import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Active ETF Consensus Radar",
  description: "主動 ETF 經理人共識推演",
  icons: {
    icon: "./favicon.svg",
    shortcut: "./favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className="antialiased">{children}</body>
    </html>
  );
}
