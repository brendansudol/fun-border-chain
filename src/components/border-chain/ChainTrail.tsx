"use client";

import type { CountryMeta } from "@/lib/border-chain/types";

type ChainTrailProps = {
  chain: string[];
  meta: CountryMeta;
};

export default function ChainTrail({ chain, meta }: ChainTrailProps) {
  return (
    <section className="bc-panel bc-chain" aria-label="Current chain">
      <div className="bc-panel__header">
        <p className="bc-eyebrow">Chain</p>
        <h2>Current path</h2>
      </div>

      <div className="bc-chain__trail">
        {chain.map((code, index) => (
          <div
            className={`bc-chain__node ${index === chain.length - 1 ? "is-current" : ""}`}
            key={`${code}-${index}`}
          >
            <span>{meta[code]?.name ?? code}</span>
            {index < chain.length - 1 ? <small>→</small> : null}
          </div>
        ))}
      </div>
    </section>
  );
}
