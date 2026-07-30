# Development and verification

**Status:** current foundation plus proposed MS-002 target
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

## MS-002 target — not yet executable

The proposed accepted sequence will be:

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

## Why implementation is paused

`MS-002` is risk class R3. Its preparation package is complete enough for
review, but its required human Security Reviewer has not yet approved the
toolchains, bootstrap channels, CI permissions, scanner/SBOM tools, and artifact
retention. Until that approval is linked, `FEAT-0002` and `ADR-0005` remain
`Proposed` and no dependency or workflow migration may start.

See [planning/MS-002-KICKOFF.md](../planning/MS-002-KICKOFF.md) for the eight
independently mergeable delivery slices.
