# Privacy baseline

**Status:** inventory preparation; human review required

**Date:** 2026-07-30

**Not legal advice**

## Current demo

The current repository slice renders a synthetic, unauthenticated operations
console. It has no player-account database, payment flow, support system, game
ledger persistence, analytics integration, or live railway provider.

The repository does contain a connected external demo-hosting descriptor and a
Cloudflare-compatible build path. An external host can ordinarily process HTTP
request metadata even when the application does not create accounts. The
provider role, terms, processing region, logs, retention, deletion, security,
and data-processing agreement have not been approved for production.

Therefore the connected deployment is:

- development/demo only;
- limited to public build output and synthetic fixtures;
- not authorized for accounts, provider data, payments, support cases,
  authoritative worlds, or production telemetry;
- removable without affecting future simulation, login, ledger, or
  entitlements.

## Required inventory before personal data

Before a feature stores or transmits personal or linkable user data, its
milestone must record:

- purpose and legal basis;
- data subjects and exact fields;
- source, recipient, processor, subprocessor, and region;
- authentication, authorization, encryption, secrets, and audit access;
- retention, deletion, export, correction, objection, and account-closure path;
- backup and log deletion behavior;
- incident detection, notification, and evidence retention;
- children/age decision, moderation and abuse data where relevant;
- whether a data-protection impact assessment is required;
- accountable human privacy approval.

## Planned data boundaries

| Boundary | Planned data | First gate |
|---|---|---|
| Keycloak | account identifiers, credentials/factors, sessions | `MS-012` |
| Game database | memberships, EVU ownership, world activity, audit | `MS-012` |
| Odoo | contacts, invoice recipients, support, billing metadata | `MS-052` |
| Payment provider | payer and transaction metadata; never game advantage | `MS-053` |
| Observability | pseudonymous operational IDs and security signals | `MS-055` |
| Notification providers | destination and message metadata | `MS-050`/`MS-053` |
| Railway source pipeline | primarily public non-personal data; provider credentials and contacts remain protected | `MS-020` onward |

Odoo, payments, and identity must remain outside simulation authority. Logs and
telemetry must use opaque IDs and must not contain credentials, raw provider
payloads, billing details, contract text, or hidden reasoning.

## Exit gate

This baseline is complete only as a preparation artifact. It does not satisfy
the privacy approval required by `MS-001`, and it does not replace the full
security/privacy/legal hardening in `MS-070`.
