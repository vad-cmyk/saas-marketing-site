import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Stage List vs Stageforce — Compared",
  description:
    "How Stage List compares to Stageforce for property stagers: pricing, interface, and what each tool actually includes.",
  alternates: { canonical: "/compare/stageforce" },
};

const rows: Array<[string, string, string]> = [
  [
    "Built for",
    "Warehouse operations, teams, RFID",
    "One storage unit, one phone",
  ],
  [
    "Primary interface",
    "Web platform + companion scanner app",
    "Phone-first app, plus web login",
  ],
  [
    "Client-facing",
    "Online store for selling staged furniture to buyers",
    "Shareable proposal link/PDF of what's going in",
  ],
  [
    "Inventory pricing",
    "From $49/month (up to 1,000 items), tiered by item count, plus 1% platform fee",
    "£29/month flat, unlimited items",
  ],
  [
    "Also includes",
    "CRM, proposals with e-signature, invoicing, e-commerce, analytics",
    "Nothing else — on purpose",
  ],
  ["Trial", "30 days", "30 days, no card"],
];

export default function CompareStageforce() {
  return (
    <>
      <Nav />
      <main className="flex-1 bg-cream">
        <div className="mx-auto max-w-4xl px-6 py-20 sm:px-8">
          <h1 className="text-3xl text-ink sm:text-4xl">
            Stage List vs Stageforce
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Compared November 2026 — check their site for current pricing.
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-line">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-cream-deep/60">
                  <th className="border-b border-line p-4 font-display text-base text-ink">
                    &nbsp;
                  </th>
                  <th className="border-b border-line p-4 font-display text-base text-ink">
                    Stageforce
                  </th>
                  <th className="border-b border-line p-4 font-display text-base text-ink">
                    Stage List
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, stageforce, stageList]) => (
                  <tr key={label} className="bg-paper">
                    <th
                      scope="row"
                      className="border-b border-line p-4 align-top font-semibold text-ink"
                    >
                      {label}
                    </th>
                    <td className="border-b border-line p-4 align-top text-ink-soft">
                      {stageforce}
                    </td>
                    <td className="border-b border-line p-4 align-top text-ink-soft">
                      {stageList}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-8 max-w-2xl text-base text-ink-soft">
            If you need what&rsquo;s in their left column, use Stageforce. If
            you&rsquo;ve been paying for it and using a fifth of it, try Stage
            List.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
