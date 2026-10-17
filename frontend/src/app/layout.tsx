import type { Metadata } from "next";
import "./globals.css";
import { AdvisingProvider } from "@/components/campus/advising-provider";

export const metadata: Metadata = {
  title: "CUNY Advisor V2 | Academic Workspace",
  description:
    "A local chat-first workspace for draft catalogs and hypothetical academic progress, starting with BMCC.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AdvisingProvider>{children}</AdvisingProvider>
      </body>
    </html>
  );
}
