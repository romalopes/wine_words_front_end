import { Link } from "react-router-dom"
import type { MouseEvent } from "react"
import type { CommentableKind } from "../../types/comment"

interface CommentLinkProps {
  kind: CommentableKind
  /** Slug (preferred) or numeric id, matching the detail-page URL. */
  identifier: string | number | null | undefined
  /**
   * Path back to the listing, so the detail page's Back link returns the user to
   * the page they came from instead of the default list.
   */
  returnTo?: string
}

const PATH_BY_KIND: Record<CommentableKind, string> = {
  wine: "wines",
  review: "reviews",
  article: "articles",
}

/**
 * The 💬 affordance on a wine / review / article card.
 *
 * It is a real `<Link>` to the detail page's `#comments` anchor rather than a
 * button that navigates in code: middle-click, ctrl-click and "open in new tab"
 * all behave the way a user expects from something that looks like a link.
 *
 * `CommentSection` owns the other half — it focuses itself when it is the
 * hash target, so arriving here scrolls to the thread AND moves keyboard focus
 * there (a plain `#anchor` jump would only scroll, leaving focus behind).
 *
 * Deliberately does NOT fetch the comment count: this renders once per card, so
 * counting would mean one request per card in a list. The count belongs in the
 * list payload when that is worth adding.
 */
export default function CommentLink({ kind, identifier, returnTo }: CommentLinkProps) {
  if (identifier === null || identifier === undefined || identifier === "") return null

  const target = `/${PATH_BY_KIND[kind]}/${identifier}#comments`
  const to = returnTo ? `${target}?returnTo=${encodeURIComponent(returnTo)}` : target

  return (
    <Link
      to={to}
      className="comment-link"
      // The whole card is a click target; without this the card's own handler
      // would fire too and navigate without the anchor.
      onClick={(event: MouseEvent) => event.stopPropagation()}
      aria-label="Go to comments"
      title="Go to comments"
    >
      <span aria-hidden="true">💬</span>
    </Link>
  )
}