# Security Policy

## Scope

`data-investigation-kit` is a local, deterministic CLI toolkit, template generator, and portable AI-agent skill bundle. It executes locally on your machine with zero runtime npm dependencies and makes no outbound network requests during `init`, `audit`, `kpis`, `verify`, `og`, or `parallel-plan`.

## Data & Credential Hygiene

- Never commit API keys, session cookies, private database URIs, or unredacted personal data into public investigation datasets.
- Keep raw harvested payloads with unredacted personal identifiers outside git (e.g., in an ignored `.tmp/` or `raw-private/` folder) and publish only audited, minimized JSON records required to verify public claims.
- All interactive explorer templates escape untrusted strings before DOM insertion and restrict external links to `http://` and `https://` schemes.

## Reporting a Vulnerability

Please report security issues privately via GitHub Security Advisories on this repository rather than opening a public issue with exploit details.
