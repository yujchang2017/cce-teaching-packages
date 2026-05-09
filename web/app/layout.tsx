import type { Metadata } from "next";
import "./globals.css";
import TopNav from "@/components/TopNav";
import Footer from "@/components/Footer";
import SiteStatusNotice from "@/components/SiteStatusNotice";

export const metadata: Metadata = {
  title: "community.cce.tw · 氣候變遷教案社群",
  description: "依據 UNESCO《綠色課程指南：氣候行動的教學與學習》(Greening curriculum guidance: Teaching and learning for climate) 開發的 136 個教學組合包、4 個年段、6 大主題；老師改編共創的開源社群。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <SiteStatusNotice />
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
