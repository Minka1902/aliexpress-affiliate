import { Suspense } from "react";
import { SettingsClient } from "./SettingsClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SettingsClient />
    </Suspense>
  );
}
