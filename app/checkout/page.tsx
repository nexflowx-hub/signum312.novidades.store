import { Suspense } from "react";
import PixCheckout from "@/components/PixCheckout";

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="checkout-loading">
          <span>SIGNUM 312</span>
          <p>Preparando checkout...</p>
        </main>
      }
    >
      <PixCheckout />
    </Suspense>
  );
}
