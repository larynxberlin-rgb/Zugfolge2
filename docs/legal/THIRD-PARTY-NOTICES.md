# Third-party and asset obligation status

**Status:** inventoried; independent legal, IP, and security review pending

**Last updated:** 2026-08-01

This document explains the S04 control surface required by `FEAT-0003`
(`RIGHTS-002`, `RIGHTS-003`, `RIGHTS-007`, `AC-006`, and `AC-010`). It is not
legal advice and does not approve a dependency or asset merely because it is
listed.

## Machine-readable sources

- [`compliance/assets.yaml`](../../compliance/assets.yaml) records every known
  brand/fixture file, its checksum, provenance state, permitted uses, release
  eligibility, reviewer role, and rollback.
- [`compliance/dependencies.yaml`](../../compliance/dependencies.yaml) records
  the current locked npm graph, direct purposes, every observed license
  expression, current GitHub Action pins, the unlocked Python build dependency,
  and distribution obligations.
- [`THIRD-PARTY-NOTICES.txt`](../../public/legal/THIRD-PARTY-NOTICES.txt) is the
  deterministic notice bundle shipped by the local web build.

## Current result

The npm graph is exactly resolved and all 438 non-root lock entries expose
license metadata. Metadata is an inventory input, not a compatibility decision.
All observed expressions therefore remain `HUMAN_REVIEW_REQUIRED`.

The Python packages have no runtime dependencies. Their build backend is pinned
as `hatchling==1.27.0`, but no resolved Python lock exists yet. A public release
remains blocked until the integrated MS-002 toolchain supplies and verifies that
lock.

All current GitHub Actions use full commit SHAs. Their repositories report MIT
license metadata, but commit provenance, release ownership, runtime trust, and
upgrade decisions remain subject to the independent S04/S07 review.

No font, audio, container, or remote-font artifact is currently tracked. The UI
uses local system fallbacks; a later bundled font requires its exact bytes,
checksum, license text, attribution, and distribution decision before use.

## Release blockers

The current Block-Z component, favicon, social preview, and synthetic pilot
fixture remain `LicenseRef-Zugfolge-Provenance-Pending`. They have no approved
uses and make any containing build evaluation-only. S04/S06 must approve,
replace, or technically exclude them before public deployment or release.

Copyleft- and attribution-bearing build packages, including LGPL, MPL, CC BY,
and Python-2.0 metadata in the npm graph, require an independent determination
of whether and how their code enters each release artifact. Current tests prove
that known native/build-only payloads do not leak into `dist`; this does not
replace the legal compatibility decision.

## Drift and rollback

`tests/compliance.test.mjs` fails when:

- a registered asset changes bytes;
- a new media/font/audio/container file lacks an inventory entry;
- the canonical npm lock digest or package count changes;
- a lock entry has no license metadata or an unregistered expression;
- a direct package, distributed package, or workflow Action drifts;
- an Action stops using a full 40-character commit SHA.

Rollback restores or removes an item together with its matching notice and
inventory record. Historical evidence remains in Git history; a failed review
never becomes an implicit approval.
