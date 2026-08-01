# Zugfolge Odoo bridge

Odoo Community is an asynchronous back-office peer, never part of the
simulation hot path. This directory starts with a dependency-free, executable
trust-boundary kernel for signed webhooks and idempotent message reception.

```bash
pnpm verify
```

For an isolated Python development check after the locked workspace sync:

```bash
python -m unittest discover -s integrations/odoo/tests -v
```

The bridge contract requires:

- HMAC-SHA256 over the exact timestamp and request bytes;
- constant-time signature comparison;
- a short replay window;
- one stable message ID per logical event;
- rejection when a message ID is reused with different bytes;
- queueing before any game command;
- no direct access to game tables.

The actual Odoo add-on, payment provider and entitlement command handlers remain
out of scope until their contracts, provider rights and human security review
are accepted. Odoo outages must not stop login, simulation, Livemap or existing
entitlements.
