import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import { ToastProvider } from "@/components/common/toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: {
    default: "BotleValor — Recycle Today. Earn Tomorrow.",
    template: "%s · BotleValor",
  },
  description:
    "BotleValor rewards you for recycling plastic bottles at designated bins around Dili, Timor-Leste.",
  icons: { icon: "/images/logo-mark.png", apple: "/images/logo-mark.png" },
};

export const viewport: Viewport = {
  themeColor: "#148a45",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${inter.variable} ${outfit.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[2000] focus:rounded-xl focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-navy-900 focus:shadow-raised"
        >
          Skip to main content
        </a>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
