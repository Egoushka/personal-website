import type { Metadata } from "next";
import Shell from "@/components/Shell";
import ProductList from "@/components/ProductList";
import { pageMetadata } from "@/lib/metadata";
import { PRODUCTS, STATE_NOTE, READ_DATE } from "@/lib/shop";

const description =
  "Seven tools for running agents calmly, each on its own address. The essentials are free; what is paid is stated before you click, and no price is set yet.";

export const metadata: Metadata = pageMetadata({ title: "Shop", description, path: "/shop/" });

/** The product board. Every row is the state as read on READ_DATE, never a price that does not exist. */
export default function Shop() {
  return (
    <Shell current="shop">
      <header className="hero hero-slim">
        <div>
          <h1>Shop</h1>
          <p className="lede">
            Tools for running agents calmly. Each lives on its own address, never on this site. The essentials of each
            one are free. What is paid is stated before you click, and no price is set yet, so none is shown.
          </p>
        </div>
      </header>
      <div className="kpis kpis-3 mb-4">
        <div className="kpi">
          <span>products</span>
          <span className="figv">{PRODUCTS.length}</span>
          <em>{STATE_NOTE}</em>
        </div>
        <div className="kpi">
          <span>paying users</span>
          <span className="figv">0</span>
          <em>across all of them</em>
        </div>
        <div className="kpi">
          <span>prices set</span>
          <span className="figv">0</span>
          <em>&quot;price not set&quot; until one is</em>
        </div>
      </div>
      <section className="pn" aria-labelledby="board-h">
        <div className="pn-head">
          <h2 id="board-h">Product board</h2>
        </div>
        <ProductList full />
        <div className="pn-foot">
          <span>usage comes from each product&apos;s own counter once it exists</span>
          <span>&quot;coming&quot; = not deployed, read {READ_DATE}</span>
        </div>
      </section>
      <div className="pb-16" />
    </Shell>
  );
}
