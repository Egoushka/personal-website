import config from "@/payments/config.json";

/**
 * Checkout config for the page: payments/config.json. The client token and price
 * ids are public identifiers, not secrets. The webhook secret and API key live
 * only in the fulfilment service (personal/paddle-fulfil, which keeps its own
 * products.json mapping the same price id to the file it delivers).
 */
export type PaymentsConfig = {
  environment: "sandbox" | "production";
  clientToken: string | null;
  products: Product[];
};

export type Product = {
  id: string;
  name: string;
  /** Paddle price id (pri_...). Null until the account has one. */
  priceId: string | null;
};

export const payments = config as PaymentsConfig;

export function getProduct(id: string): Product {
  const p = payments.products.find((x) => x.id === id);
  if (!p) throw new Error(`unknown product: ${id}`);
  return p;
}

/** True once the owner has put a client token and a price id in payments/config.json. */
export function checkoutReady(product: Product, cfg: PaymentsConfig = payments): boolean {
  return Boolean(cfg.clientToken && product.priceId);
}
