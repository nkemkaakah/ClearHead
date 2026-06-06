import type { Metadata } from "next";
import { CrisisEscapeHatch } from "@/components/crisis/CrisisEscapeHatch";
import { CrisisProvider } from "@/components/crisis/CrisisProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearHead",
  description:
    "AI-supported student mental-health support navigator for UK students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen antialiased">
        <CrisisProvider>
          {children}
          <CrisisEscapeHatch />
        </CrisisProvider>
      </body>
    </html>
  );
}
