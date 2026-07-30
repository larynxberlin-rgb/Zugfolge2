# ADR-0004: Monetize convenience without competitive advantage

**Status:** Accepted  
**Date:** 2026-07-30  
**Deciders:** Product Owner, Economy Steward

## Context

Zugfolge is free to play and needs sustainable monetization. Its appeal depends
on fair competition for scarce infrastructure and contracts. Selling better
capacity access, lower costs, faster simulation treatment, or privileged data
would invalidate both the economy and the realism promise.

## Decision

Paid entitlements may unlock convenience and presentation, never a superior
competitive outcome.

Allowed examples:

- cosmetics and additional company-brand presentation;
- saved dashboards, filters, layouts, and longer non-authoritative history;
- configurable notifications and exports;
- bulk user-interface operations that execute the same validated commands;
- convenience automation whose manual equivalent is available for free and that
  observes the same data, clocks, limits, queues, prices, and conflict rules.

Forbidden examples:

- priority or guaranteed access to train paths, tenders, vehicles, or terminals;
- discounts, grants, better credit, increased revenue, or reduced running cost;
- improved vehicle statistics, reliability, maintenance, or recovery;
- earlier/private access to operational data that affects decisions;
- favorable random outcomes or fewer disruptions;
- faster world ticks, command processing, or server scheduling;
- automation that acts more frequently, earlier, with more information, or
  outside limits available to a manual player.

Entitlements are server-validated capabilities. Game-domain services decide
whether an action is legal; Odoo or a billing system cannot bypass that decision.
Every paid capability MUST have a written fairness analysis and automated
equivalence test before release.

## Options considered

### Convenience and cosmetics under equivalence rules

Chosen because it creates recurring value without selling scarce in-game
resources. It requires careful review of automation and information timing.

### Cosmetics only

Fair and simple, but rejected as the sole model because a data-heavy management
game can offer legitimate workflow value without changing outcomes.

### Paid competitive boosts

Rejected because it conflicts with the product constitution and would undermine
the shared capacity market.

## Consequences

- Premium actions use the same public command handlers as manual actions.
- Free-player completion of core SPFV, SGV, and SPNV loops is an acceptance gate.
- Pricing and packaging can change without changing simulation contracts.
- If equivalence cannot be demonstrated, the feature is treated as pay-to-win
  and MUST NOT ship.
