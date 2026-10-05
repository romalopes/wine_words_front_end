# Article Projects — Phase 1: Database and Models (Frontend Dependency Record)

## Status

Planned. This phase is implemented in the API repository; no frontend product code is expected.

## Required backend contract before frontend work

The frontend depends on the API exposing an Article Project owned by `created_by` (`User`), with separate `project_status` and `drafting_status`, optional Article link, three tracking joins, `lock_version`, and database-enforced unique Article ownership.

The form must never submit `created_by_id`. It will submit only supported editable Article Project fields, the current `lock_version` for updates, and nested join changes according to the Phase 3 contract.

## UI implications

- Article link is zero-or-one; one Article cannot appear in two Article Projects.
- Producer, Vintage, and Review links are join records, not direct ID arrays.
- Producer/Vintage tracking values belong to Article Project join rows and must not modify source records.
- Deleting an Article Project or removing a link must never be presented as deleting Articles, Reviews, Producers, or Vintages.

## Exit gate

Begin frontend implementation only after API migrations and focused model tests establish the shape and lifecycle of the Article Project payload.