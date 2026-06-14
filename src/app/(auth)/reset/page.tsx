import { Suspense } from "react";
import { ResetForm } from "./ResetForm";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
