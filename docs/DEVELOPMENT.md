# Development and verification

**Status:** current foundation plus accepted MS-002 target
**Supported production services:** none required for this stage

This guide deliberately separates commands that work on the current foundation
from commands planned by `MS-002`. Do not assume a planned command exists until
its slice is merged.

## Current foundation

The current web foundation requires Node.js `>=22.13.0` and npm:

```text
npm ci
npm run lint
npm test
```

The current Python kernels require Python 3.12:

```text
python -m compileall -q apps/data-pipeline/src integrations/odoo/src
python -m unittest discover -s apps/data-pipeline/tests -v
python -m unittest discover -s integrations/odoo/tests -v
```

GitHub Actions is the clean Ubuntu reference. If `node`, `npm`, or `python`
cannot be found locally, install the declared official runtime; do not use the
presence of a cached `node_modules`, virtual environment, or system Gradle as
evidence that the machine is supported.

No database, broker, container engine, map service, Keycloak, Odoo instance, or
cloud account is needed for the current checks. Planned self-hosted runtime
services and their introduction milestones are documented in
[SERVICES.md](SERVICES.md).

## MS-002 target — accepted, not yet executable

The accepted sequence will be introduced by S02–S07:

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
independently. No command in the target sequence is claimed executable before
its owning slice has merged and passed its rollback and clean-install checks.

See [planning/MS-002-KICKOFF.md](../planning/MS-002-KICKOFF.md) for the eight
independently mergeable delivery slices.
