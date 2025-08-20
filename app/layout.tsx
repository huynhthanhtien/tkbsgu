// layout.tsx (server component)
import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import RootProviders from "./RootProviders"; // client wrapper

export const metadata: Metadata = {
  title: "TKB",
  description: "...",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RootProviders>{children}</RootProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
