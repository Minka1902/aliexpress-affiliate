import { Suspense } from "react";
import { LinkGenerator } from "./LinkGenerator";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LinkGenerator />
    </Suspense>
  );
}
