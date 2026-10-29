import type { Metadata, Viewport } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Shell } from "@/components/Shell";

const inter = Source_Sans_3({ variable: "--font-inter", subsets: ["latin"], weight: ["400","600","700"], display: "swap" });

export const metadata: Metadata = {
  title: "SINDAPARKA - Pemantauan stunting untuk kader posyandu",
  description:
    "Catat penimbangan, hitung z-score WHO, dan pantau tren pertumbuhan balita di posyandu.",
  metadataBase: new URL("https://sindaparka.web.id"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "SINDAPARKA",
    description: "Catat penimbangan, hitung z-score WHO, dan pantau tren pertumbuhan balita di posyandu.",
    type: "website",
    images: [{ url: "/og-cover.jpg", width: 480, height: 251, alt: "SINDAPARKA" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-cover.jpg"] },
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icon-32.png", sizes: "32x32", type: "image/png" }, { url: "/favicon.ico", sizes: "any" }], apple: "/apple-touch-icon.png" },
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
