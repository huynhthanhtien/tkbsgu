import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { SubjectProvider } from "@/context/SubjectsContext";
import { IndexedDBProvider } from "@/context/IndexedDBContext";
import { TkbProvider } from "@/context/TkbContext";


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
          <IndexedDBProvider>
            {/* <TkbProvider> */}
              {/* <SubjectProvider> */}
                {children}
              {/* </SubjectProvider> */}
            {/* </TkbProvider> */}
          </IndexedDBProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
