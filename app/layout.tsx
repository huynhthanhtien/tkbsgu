import "./globals.css";
import { GeistSans, GeistMono } from "geist/font";
import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";

import { SubjectProvider } from "@/context/SubjectsContext";
import { IndexedDBProvider } from "@/context/IndexedDBContext";
import { TkbProvider } from "@/context/TkbContext";
import Footer from "@/components/Footer";
import { Toaster } from "sonner";
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
            <Toaster richColors position="top-right" />
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow">
                {children}
              </main>
              {/* <Footer /> */}
            </div>
          </IndexedDBProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
