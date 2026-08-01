# AI-assisted work provenance

**Status:** policy active; historic file-level review open
**Last updated:** 2026-07-30

Zugfolge is developed predominantly with AI-assisted implementation agents
under project-owner direction. Repository specifications, issues, reviewed
diffs, tests, and commits are the engineering record; prompts, hidden reasoning,
and agent memory are not rights evidence and must not be committed.

For material AI-assisted code, text, fixtures, or assets, the review record must
identify:

- the tool or service category and applicable terms reference;
- the human or accountable agent role that selected, edited, and reviewed it;
- checks for recognizable third-party code, text, images, confidential inputs,
  and incompatible licenses;
- the tracked file checksum and decision date;
- replacement or rollback behavior if provenance later becomes insufficient.

AI assistance alone is not described as proof of copyright ownership or
protectability. The project licenses only rights the licensor is authorized to
grant.

Current synthetic pilot data is embedded in an application source file but is
explicitly excluded from the AGPL grant through
`LicenseRef-Zugfolge-Provenance-Pending`. It is not separately released under
CC0. The current Block-Z React implementation, favicon, and social image also
remain provenance-pending. Trademark and endorsement rules are separate in
every case.

External contributors must disclose meaningful AI assistance once contribution
intake opens. Until the counsel-reviewed CLA and its required check are active,
external pull requests are not incorporated.
