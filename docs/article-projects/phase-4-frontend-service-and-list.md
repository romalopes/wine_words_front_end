# Article Projects — Phase 4: Frontend Service and List

## Status

Planned. Phase 3 API contract is a prerequisite.

## Deliverables

1. Add Article Project API types and a `createArticleProjectsApi` factory following `src/services/contentApi.ts` conventions.
2. Export `articleProjectsApi` from `src/services/api.ts`.
3. Add `/article-projects` to `src/components/AppRoutes.tsx`.
4. Add a role-gated Article Projects navigation item in `src/components/Header.tsx` for Reviewer, Editor, and Admin users.
5. Build an Article Project list component following established loading, empty, error, retry, pagination, and responsive styling conventions.

## List features

- Remote search by name/publication/editor name.
- Article Project-status and drafting-status filters.
- Overdue filter.
- Allowlisted sorting and pagination.
- Deadline/overdue indicators.
- Vintage count summary.
- Owner display where API scope makes it useful for managers.
- Authorized row actions only.

## Stale request prevention

Use the cancellation/request-generation pattern already demonstrated in `src/components/Articles.tsx`. A delayed response for an older search/filter state must not overwrite newer results or incorrectly clear the active loading state.

## Tests

Add Vitest coverage for loading, empty, error/retry, filter/query serialization, stale-response protection, role-gated navigation, and rendering scoped list results.

## Exit gate

The list is accessible, responsive, retryable, and displays only API-authorized Article Projects.