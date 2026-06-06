import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { CrisisEscapeHatch } from "@/components/crisis/CrisisEscapeHatch";
import { CrisisProvider } from "@/components/crisis/CrisisProvider";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClearHead",
  description:
    "AI-supported student support navigator for UK students — signposting to NHS and uni services.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB" className={`${fraunces.variable} ${dmSans.variable}`}>
      <body className="min-h-screen antialiased">
        <CrisisProvider>
          {children}
          <CrisisEscapeHatch />
        </CrisisProvider>
      </body>
    </html>
  );
}
