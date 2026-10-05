# Article Projects — Phase 3: Authorization and Transactional API (Frontend Contract)

## Status

Planned. This phase is implemented in the API repository before Article Project UI mutation work.

## Required client API

`articleProjectsApi` will provide:

```ts
articleProjectsApi.list(params, options?)
articleProjectsApi.show(id)
articleProjectsApi.create(payload)
articleProjectsApi.update(id, payload)
articleProjectsApi.destroy(id)
```

The service must use the existing authenticated request client and preserve `ApiError` behavior.

## Mutation contract consumed by forms

- New joins send target IDs.
- Existing joins send join `id` and changed tracking values.
- Removals send join `id` with `_destroy: true`.
- Omitted association attributes are unchanged; empty arrays do not clear server links.
- Existing join targets are immutable; replacement is remove plus add.
- Article unlink sends `article_id: null`.
- Updates include the Article Project's current `lock_version`, including association-only edits.

## Required UI error behavior

- Preserve form values when the API returns validation errors.
- Render field-specific messages when available, with a safe general fallback.
- On conflict, retain unsaved local values, explain that server data changed, and offer an explicit reload/retry path. Never silently overwrite.
- Treat 401/403 consistently with current authentication/error handling and do not expose restricted records through UI state.

## Exit gate

The client has typed payload/response shapes and handles validation, authorization, and stale-write outcomes without data loss.