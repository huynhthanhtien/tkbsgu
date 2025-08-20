import { redirect } from "next/navigation";
import { Suspense } from "react";
import HomePage from "@/app/HomePage"

export default function Page() {
    return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePage />
    </Suspense>
  );
}
