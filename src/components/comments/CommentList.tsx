import CommentItem from "./CommentItem"
import type { CommentDTO } from "../../types/comment"

interface CommentListProps {
  comments: CommentDTO[]
  loading: boolean
  pending: boolean
  error: string | null
  canReply: boolean
  onReply: (commentId: number, body: string) => Promise<void>
  onUpdate: (commentId: number, body: string) => Promise<void>
  onDelete: (commentId: number) => Promise<void>
  /** Tracks which comment currently owns an open inline form. */
  onFormOpenChange: (commentId: number | null) => void
}

/** The thread itself, with the loading / empty / error states. */
export default function CommentList({
  comments,
  loading,
  pending,
  error,
  canReply,
  onReply,
  onUpdate,
  onDelete,
  onFormOpenChange,
  /** Set while one of the inline forms owns the error display. */
  suppressError = false,
}: CommentListProps & { suppressError?: boolean }) {
  if (loading) {
    return <p className="comments__status">Loading comments...</p>
  }

  if (comments.length === 0) {
    return <p className="comments__status">No comments yet. Start the discussion.</p>
  }

  return (
    <>
      {/* Suppressed while an inline form is open: that form shows the same
          failure, and printing it twice would announce it twice. */}
      {error && !suppressError && (
        <p className="comment-form__error" role="alert">
          {error}
        </p>
      )}
      <ul className="comment-list">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
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
    </>
  )
}