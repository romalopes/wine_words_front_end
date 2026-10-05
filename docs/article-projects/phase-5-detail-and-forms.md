# Article Projects — Phase 5: Detail and Create/Edit Forms

## Status

Planned. Phases 3 and 4 are prerequisites.

## Routes and sections

Add routes for:

```text
/article-projects/new
/article-projects/:id
/article-projects/:id/edit
```

Organize detail content into Overview, Article, Producers, Wines, and Reviews. Use existing component and CSS-module/global-style conventions rather than redesigning the application.

## Form requirements

Editable scalar fields:

- Name, publication, editor name/email.
- Article Project status and drafting status.
- Deadline, target word count, and description.

Read-only values:

- Actual word count, remaining count, overdue state, owner, and server-managed timestamps/lock version.

## Association editing

- One remote Article picker.
- Multiple Producer, Vintage, and Review pickers.
- Debounce requests and prevent stale responses.
- Prevent duplicate links locally while relying on backend validation as the source of truth.
- Preserve persisted join IDs and track new, edited, and removed rows separately until save.
- Suggest Vintages associated with selected Producers, without limiting authorized searches to those producers.
- Removing a Producer must not remove Article Project Vintage rows.
- Match API tracking rules for producer confirmation and vintage receipt/condition values.

## Save, deletion, and navigation behavior

- Keep user-entered values after validation errors.
- Detect unsaved edits and warn before route/window departure.
- Confirm Article Project deletion.
- Resolve conflict responses explicitly; never overwrite local edits silently.
- Link existing Articles first.

## Create article draft

Only add this workflow if the existing Article form supports prefill and normal private-draft creation. It must create an Article through the normal API, then link through an Article Project update. If linking fails, preserve the created draft, display the failure accurately, and offer retry.

## Tests

Add component tests for join payload construction, duplicate prevention, validation preservation, conflict handling, deletion confirmation, picker debounce/staleness, and Article draft link-failure messaging.

## Exit gate

All association operations retain underlying records, preserve join identity, and produce the API's explicit additions/updates/removals contract.