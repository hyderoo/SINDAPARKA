import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SINDAPARKA - Pemantauan stunting untuk kader posyandu",
  description:
    "Catat penimbangan, hitung z-score WHO, dan pantau tren pertumbuhan balita di posyandu. Demo memakai data sintetis.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
};
export const viewport: Viewport = { themeColor: "#1f5f56", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${jakarta.variable} ${fraunces.variable}`}>
      <body>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
