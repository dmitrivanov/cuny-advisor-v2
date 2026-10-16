import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUNY Advisor V2 | Local Preview",
  description: "The local foundation for a future academic advising workspace, starting with BMCC.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
