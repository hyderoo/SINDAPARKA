import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const inter = Source_Sans_3({ variable: "--font-inter", subsets: ["latin"], weight: ["400","600","700"], display: "swap" });

export const metadata: Metadata = {
  title: "SINDAPARKA - Pemantauan stunting untuk kader posyandu",
  description:
    "Catat penimbangan, hitung z-score WHO, dan pantau tren pertumbuhan balita di posyandu.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#0B63CE", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
