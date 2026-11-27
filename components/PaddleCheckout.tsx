"use client";

import { useState } from "react";
import { payments, type Product } from "@/lib/payments";

type PaddleEvent = { name?: string };
type PaddleJs = {
  Environment: { set(env: "sandbox"): void };
  Initialize(opts: { token: string; eventCallback?: (e: PaddleEvent) => void }): void;
  Checkout: { open(opts: { items: { priceId: string; quantity: number }[]; settings: Record<string, string> }): void };
};

const SCRIPT = "https://cdn.paddle.com/paddle/v2/paddle.js";

let loading: Promise<PaddleJs> | null = null;

function load(onPaid: () => void): Promise<PaddleJs> {
  loading ??= new Promise<PaddleJs>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT;
    s.onload = () => {
      const paddle = (window as unknown as { Paddle: PaddleJs }).Paddle;
      if (payments.environment === "sandbox") paddle.Environment.set("sandbox");
      paddle.Initialize({
        token: payments.clientToken as string,
        eventCallback: (e) => e.name === "checkout.completed" && onPaid(),
      });
      resolve(paddle);
    };
    s.onerror = () => {
      loading = null;
      reject(new Error("paddle.js failed to load"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Buy button: loads Paddle.js on the first click (nothing from Paddle loads for a
 * reader who never buys) and opens the overlay. Delivery is the fulfilment
 * service's job, after Paddle's paid webhook; this only tells the buyer to look
 * at their inbox.
 */
export default function PaddleCheckout({ product, label, className }: { product: Product; label: string; className: string }) {
  const [state, setState] = useState<"idle" | "loading" | "paid" | "error">("idle");

  async function buy() {
    setState("loading");
    try {
      const paddle = await load(() => setState("paid"));
      paddle.Checkout.open({
        items: [{ priceId: product.priceId as string, quantity: 1 }],
        settings: { displayMode: "overlay", theme: "light", locale: "en" },
      });
      setState((s) => (s === "paid" ? s : "idle"));
    } catch {
      setState("error");
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={buy} data-umami-event="checkout-open" disabled={state === "loading"}>
        {label}
      </button>
      <div role="status" className="text-base">
        {state === "paid" && <p>Paid. The download link is on its way to the email you used; it can take a minute.</p>}
        {state === "error" && (
          <p>
            Checkout could not load. Try again, or write to the address in the footer and I will send a payment link.
          </p>
        )}
      </div>
    </>
  );
}
