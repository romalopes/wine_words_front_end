# Article Projects — Phase 2: Word Counts and Summaries (Frontend Contract)

## Status

Planned. The API implements computation; the frontend renders read-only results.

## Required UI behavior

- Render `target_word_count` as an editable controlled field in create/edit forms.
- Render `actual_word_count` and `word_count_remaining` as read-only values on detail and edit screens.
- Handle `actual_word_count: null` as no linked Article, `0` as an empty linked Article, and `word_count_remaining: null` as no assignment target.
- Render a negative remaining value as over target, not as an error.
- Do not attempt client-side Article body counting or write computed counts back to Article Project.

## Vintage/deadline summaries

Article Project list and detail UI must present overlapping vintage counts (`total`, `requested`, `received`, `selected`, `tasted`) without adding them together. It must display the API's overdue state and deadline values without recomputing different business rules in the client.

## Exit gate

The UI consumes server-provided summaries accurately and preserves target word count while linked Article content changes.