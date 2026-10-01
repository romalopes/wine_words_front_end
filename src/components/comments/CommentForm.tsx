import { useId, useState } from "react"
import type { FormEvent } from "react"

interface CommentFormProps {
  /** Used as the accessible name of the textarea. */
  label: string
  submitLabel: string
  pending: boolean
  error: string | null
  onSubmit: (body: string) => void | Promise<void>
  onCancel?: () => void
  initialValue?: string
  placeholder?: string
  autoFocus?: boolean
}

/**
 * A textarea + submit button shared by the top-level comment form, the reply
 * form and the inline edit form.
 *
 * The textarea is uncontrolled while typing and only reset after a SUCCESSFUL
 * submit, so a validation error (or a network failure) never destroys what the
 * user typed.
 */
export default function CommentForm({
  label,
  submitLabel,
  pending,
  error,
  onSubmit,
  onCancel,
  initialValue = "",
  placeholder,
  autoFocus = false,
}: CommentFormProps) {
  const [body, setBody] = useState(initialValue)
  // A stable unique id, so several forms on one page (a top-level form plus a
  // reply form per comment) never share a <label for>.
  const inputId = useId()

  const tooLong = body.length > 2000

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = body.trim()
    if (trimmed === "" || tooLong || pending) return

    // Clear ONLY on success: a rejected promise means the comment was not
    // saved, and wiping the textarea would throw the user's words away.
    void Promise.resolve(onSubmit(trimmed)).then(
      () => setBody(""),
      () => {},
    )
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <label className="comment-form__label" htmlFor={inputId}>
        {label}
      </label>
      <textarea
        id={inputId}
        className="comment-form__input"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder ?? "Add a comment..."}
        rows={3}
        disabled={pending}
        autoFocus={autoFocus}
      />
      {tooLong && (
        <p className="comment-form__error" role="alert">
          Comments are limited to 2000 characters.
        </p>
      )}
      {error && (
        <p className="comment-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="comment-form__actions">
        <button type="submit" disabled={pending || body.trim() === "" || tooLong}>
          {pending ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={pending}>
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}