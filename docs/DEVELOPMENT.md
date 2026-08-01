# Development and verification

**Status:** current foundation plus accepted MS-002 target
**Supported production services:** none required for this stage

This guide deliberately separates commands that work on the current foundation
from commands planned by `MS-002`. Do not assume a planned command exists until
its slice is merged.

## Current JavaScript foundation

The web foundation requires exact Node.js `24.18.0` and pnpm `11.18.0`:

```text
npm install --global pnpm@11.18.0
pnpm --version
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
pnpm test
```

The first npm command bootstraps only the approved exact pnpm CLI from the
official npm registry. npm is not an alternative dependency-resolution path:
all project dependencies come exclusively from `pnpm-lock.yaml` in frozen
mode. The install permits lifecycle scripts only for the locked `esbuild` and
`workerd` packages required by the existing Vite/Cloudflare build.

The Python workspace requires exact CPython `3.13.14` and uv `0.12.0`. uv is
bootstrapped only from the approved versioned installer and runs against the
official system interpreter selected by `.python-version`:

```text
uv --version
uv sync --all-packages --locked
uv run python -m compileall -q apps/data-pipeline/src integrations/odoo/src
uv run python -m unittest discover -s apps/data-pipeline/tests -v
uv run python -m unittest discover -s integrations/odoo/tests -v
uv build --package zugfolge-data-pipeline --build-constraints build-constraints.txt --require-hashes
uv build --package zugfolge-odoo-bridge --build-constraints build-constraints.txt --require-hashes
```

Root policy constrains every package in the isolated Hatchling build closure to
an exact version during `uv sync`. Standalone distribution builds additionally
consume `build-constraints.txt` with `--require-hashes`, so their independent
PEP 517 environments accept only the artifacts recorded by `uv.lock`.

GitHub Actions is the clean Ubuntu reference. If `node`, `pnpm`, or `python`
cannot be found locally, install the declared official runtime; do not use the
presence of a cached `node_modules`, virtual environment, or system Gradle as
evidence that the machine is supported.

No database, broker, container engine, map service, Keycloak, Odoo instance, or
cloud account is needed for the current checks. Planned self-hosted runtime
services and their introduction milestones are documented in
[SERVICES.md](SERVICES.md).

## MS-002 target — JavaScript phase executable

The first two commands are executable after S02/S03; S04–S07 introduce the
remaining command and the root orchestrator:

```text
pnpm install --frozen-lockfile
uv sync --all-packages --locked
./gradlew --no-daemon --console=plain check
pnpm verify
```

Windows uses `gradlew.bat` for the third command. `pnpm verify` will run the same
logical phases on both supported systems:

1. toolchain preflight;
2. frozen dependency synchronization check;
3. specification and contract validation;
4. TypeScript checks;
5. Python checks;
6. Kotlin checks;
7. repository security and dependency-policy checks;
8. SBOM and evidence generation.

Target runner images are `ubuntu-24.04` and `windows-2025`. Exact toolchain
versions and candidate sources are in [DEPENDENCIES.md](DEPENDENCIES.md).

## Failure rules

- Verification never edits a lockfile.
- A stale manifest/lock fails before compilation.
- A wrong toolchain version produces the expected version and an official
  installation reference.
- Output identifies the failed phase but does not dump environment variables,
  credentials, personal data, or user-specific absolute paths.
- Generated output stays in ignored, dedicated directories. In particular,
  Gradle MUST NOT use or ignore the tracked `/build` source directory.

## Implementation order

The human Security Reviewer decision is recorded in
[MS-002-S01](https://github.com/larynxberlin-rgb/Zugfolge/issues/3#issuecomment-5150191133),
and `FEAT-0002` plus `ADR-0005` are accepted. S02 may migrate JavaScript only
after S01 merges; S03 and S04 then introduce the Python and Kotlin foundations
independently. No later command in the target sequence is claimed executable
before its owning slice has merged and passed its rollback and clean-install
checks.

See [planning/MS-002-KICKOFF.md](../planning/MS-002-KICKOFF.md) for the eight
independently mergeable delivery slices.
