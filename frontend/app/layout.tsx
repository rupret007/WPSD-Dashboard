import type { Metadata } from "next";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "WPSD Dashboard",
  description: "Next-generation interface for W0CHP Digital Voice Hotspot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
