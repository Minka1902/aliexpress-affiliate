import { Suspense } from "react";
import { OrdersClient } from "./OrdersClient";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <OrdersClient />
    </Suspense>
  );
}
