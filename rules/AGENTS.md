When working on public-records datasets, analytical essays, or interactive explorers:

1. Never perform mental arithmetic on monetary figures, shares, or medians. Compute every figure with `data-kit kpis` using exact integer-cent math.
2. Run `data-kit audit` on newly harvested datasets before writing narrative claims to catch 10x trailing-zero typos, repeated multi-lot totals, acronym collisions, untagged sole-source awards, and entity spelling drift.
3. Keep `incidental` non-core records in the published JSON with `scope: "incidental"` (excluded from core defaults, inspectable via a toggle) rather than silently deleting edge cases.
4. Separate measured registry facts from editorial forecasts, and bind every headline metric to `data-kit verify` before finishing a task.
