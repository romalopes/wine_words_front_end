import { useEffect, useState } from "react"
import CommentActions from "./CommentActions"
import CommentForm from "./CommentForm"
import type { CommentDTO } from "../../types/comment"

interface CommentItemProps {
  comment: CommentDTO
  pending: boolean
  error: string | null
  /** False for logged-out viewers and for Guest accounts. */
  canReply: boolean
  /** Each returns a promise that settles when the API has answered. */
  onReply: (commentId: number, body: string) => Promise<void>
  onUpdate: (commentId: number, body: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  /**
   * Called with this comment's id while an inline reply/edit form is open (and
   * with null when it closes), so the list knows which error banner to suppress
   * and the same failure is never announced twice.
   */
  onFormOpenChange: (commentId: number | null) => void
}

/**
 * One comment and its replies.
 *
 * A reply is rendered by the SAME component with an `isReply` flag rather than
 * by recursing: the API guarantees a maximum depth of one level, so the second
 * level can never exist and an unbounded recursion would only be a liability.
 */
export default function CommentItem({
  comment,
  pending,
  error,
  canReply,
  onReply,
  onUpdate,
  onDelete,
  onFormOpenChange,
  isReply = false,
}: CommentItemProps & { isReply?: boolean }) {
  const [replying, setReplying] = useState(false)
  const [editing, setEditing] = useState(false)

  const formOpen = editing || (replying && !comment.deleted)

  // Tell the list when an inline form owns the error display.
  useEffect(() => {
    onFormOpenChange(formOpen ? comment.id : null)
    return () => onFormOpenChange(null)
  }, [formOpen, comment.id, onFormOpenChange])

  return (
    <li className={isReply ? "comment comment--reply" : "comment"}>
      <div className="comment__meta">
        {/* Decorative monogram: the author name is already rendered as text
            right next to it, so this must stay out of the accessibility tree. */}
        <span className="comment__avatar" aria-hidden="true">
          {initial(comment.author.name)}
        </span>
        <span className="comment__author">{comment.author.name}</span>{" "}
        <time
          className="comment__time"
          dateTime={comment.created_at}
          title={new Date(comment.created_at).toLocaleString()}
        >
          {formatWhen(comment.created_at)}
        </time>
        {comment.edited && !comment.deleted && <span className="comment__edited">(edited)</span>}
      </div>

      {editing ? (
        <CommentForm
          label={`Edit your comment`}
          submitLabel="Save"
          pending={pending}
          error={error}
          initialValue={comment.body}
          onCancel={() => setEditing(false)}
          onSubmit={(body) => {
            // Returned (not awaited-and-forgotten) so CommentForm knows whether
            // the save succeeded before it clears the textarea.
            return onUpdate(comment.id, body).then(() => setEditing(false))
          }}
        />
      ) : (
        <p className={comment.deleted ? "comment__body comment__body--deleted" : "comment__body"}>
          {comment.body}
        </p>
      )}

      {!editing && (
        <CommentActions
          comment={comment}
          pending={pending}
          canReply={canReply}
          onReply={() => setReplying((open) => !open)}
          onEdit={() => setEditing(true)}
          onDelete={() => {
            void onDelete(comment.id)
          }}
        />
      )}

      {replying && !comment.deleted && (
        <CommentForm
          label={
            // Replying to a reply lands beside it in the same thread (the API
            // attaches it to this reply's parent), so say where it will appear.
            isReply
              ? `Reply to ${comment.author.name} (in this thread)`
              : `Reply to ${comment.author.name}`
          }
          submitLabel="Reply"
          pending={pending}
          error={error}
          autoFocus
          onCancel={() => setReplying(false)}
          onSubmit={(body) =>
            onReply(comment.id, body).then(() => setReplying(false))
          }
        />
      )}

      {comment.replies.length > 0 && (
        <ul className="comment__replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              isReply
              pending={pending}
              error={error}
              canReply={canReply}
              onReply={onReply}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onFormOpenChange={onFormOpenChange}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

/** First letter of the display name, for the avatar monogram. */
function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?"
}

/** Compact relative time: "just now", "5m", "3h", "2d", then a date. */
function formatWhen(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ""
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (seconds < 60) return "just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(iso).toLocaleDateString()
}