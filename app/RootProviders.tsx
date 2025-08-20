// RootProviders.tsx (client component)
"use client";

import { IndexedDBProvider } from "@/context/IndexedDBContext";
import { Toaster } from "sonner";

export default function RootProviders({ children }: { children: React.ReactNode }) {
  return (
    <IndexedDBProvider>
      <Toaster richColors position="top-right" />
      <div className="flex flex-col min-h-screen">
        <main className="flex-grow">{children}</main>
        {/* <Footer /> */}
      </div>
    </IndexedDBProvider>
  );
}
