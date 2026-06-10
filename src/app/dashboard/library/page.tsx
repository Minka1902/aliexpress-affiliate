import { Suspense } from "react";
import { LibraryClient } from "./LibraryClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LibraryClient />
    </Suspense>
  );
}
