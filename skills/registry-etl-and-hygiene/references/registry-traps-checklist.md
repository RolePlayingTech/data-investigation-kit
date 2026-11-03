# Common Public-Registry Distortion Traps

Use this checklist when auditing raw public filings before publishing aggregate numbers.

## 1. Magnitude & Clerical Entry Errors
- **Extra trailing zero (`10x` / `100x`):** A 54,000 contract typed as `540,000` in the final award summary while the winning bid line and pre-tender estimate both read ~50,000.
- **Cents entered as whole currency (`100x`):** Filings exported without decimal separators (`12500000` for `125,000.00`).
- **Unit-price vs. full-term ceiling:** Hourly or per-unit rate entered in place of total contract value (or framework ceiling entered when only one call-off was signed).

## 2. Multi-Lot Duplication Bugs
- **Full contract total pasted into every lot:** A vendor wins 3 lots worth `120k + 180k + 168k = 468k`, and the filing clerk enters `468k` in the contract-value box of Lot 1, Lot 2, and Lot 3 (`3 × 468k = 1.40M`).
- **Summing bids across parallel lots:** When 15 training providers bid on all 3 regional lots of the same tender, summing lot bids (`15 + 14 + 15 = 44`) fabricates phantom market depth. Record the maximum single-lot bid count (`15`) and store the lot breakdown in `lotsNote`.
- **Non-topic lots bundled into multi-lot proceedings:** Strip unrelated lots (e.g., general office laptops or unrelated workshops) when calculating domain-specific totals, and document excluded lots in `scopeNote`.

## 3. Keyword & Organizational Header Pollution
- **Department-name inheritance:** Once a university or ministry creates a "Department of Clean Energy" or "Division of Data Science", every hallway renovation, legal retainer, and chair delivery inherits that phrase in the notice header. Keep these as `category: "incidental"` (`scope: "incidental"`), excluded from core spend by default.
- **Inseparable turnkey bundles (`scope: "mixed"`):** Design-and-build construction + equipment packages where the target technology is genuine but inseparable from civil works. Retain in core with `scope: "mixed"` and provide a one-click `Pure scope only` toggle in the explorer.

## 4. Competition & Calendar Denominator Traps
- **Sole-source awards vs. missing bid counts:** A `null` bid count in an award notice frequently indicates a non-competitive statutory sole-source award rather than missing metadata. Verify the procedure section and label it `awardMode: "sole_source"`.
- **Notice publication year vs. signing year:** Awards signed in late December are often published in January of the following year. Expose both `Publication year` and `Contract / Event year` in annual charts.
- **Statutory filing floor changes:** If mandatory reporting thresholds rose mid-period, note above the fold that raw notice counts across years are censored at the lower margin.
