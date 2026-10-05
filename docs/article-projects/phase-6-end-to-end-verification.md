# Article Projects — Phase 6: End-to-End Verification

## Status

Planned. This phase begins after the Article Project API and UI are implemented.

## Required workflow verification

1. Reviewer creates an owned Article Project.
2. Reviewer links authorized producers, vintages, reviews, and an Article.
3. Reviewer updates tracking fields and removes links.
4. Another Reviewer cannot discover or access that Article Project.
5. Editors and Admins can manage it within the API's established scope.
6. Editing Article content updates actual word count without changing the target.
7. Validation errors and invalid nested updates preserve local values and roll back API changes.
8. Association-only concurrent saves receive a conflict and keep unsaved client data.
9. Article Project deletion preserves linked content.
10. Article Project data is absent from public Article and Review UI/API payloads.

## Test strategy

The current repository has Vitest and Testing Library but no configured browser test framework. At phase start, document one of these decisions:

1. add and configure a browser runner for the specified end-to-end coverage; or
2. execute the workflow with API request specs plus Vitest component/integration tests and document the manual browser accessibility/mobile checklist.

Run frontend `lint`, `typecheck`, `build`, and relevant Vitest tests, together with the corresponding backend migration and RSpec checks. Record commands and results; do not claim completion while required checks fail.

## Documentation to finalize

Document local setup, API use, migration order, role behavior, word-count semantics, concurrency behavior, keyboard/mobile verification, manual package boundary, and version-one exclusions.

## Completion gate

The complete Reviewer and manager workflows have passing automated coverage at the agreed level and completed documented manual verification where automation is unavailable.