import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { SubjectProvider } from "@/context/SubjectsContext";


export const metadata: Metadata = {
  title: "TKB",
  description: "...",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <SubjectProvider>
            {children}
          </SubjectProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
