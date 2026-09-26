import styles from "../styles/pagination.module.css";

// Reusable pagination control: « Prev · numbered pages · Next » plus a
// "Page X of Y · N items" summary. Renders nothing when there is only
// one page unless `alwaysShow` is set.
interface PaginationProps {
  page: number
  totalPages: number
  totalCount?: number
  onPageChange: (page: number) => void
  alwaysShow?: boolean
}

function Pagination({ page, totalPages, totalCount, onPageChange, alwaysShow = false }: PaginationProps) {
  if (!totalPages || totalPages < 1) return null;
  if (totalPages === 1 && !alwaysShow) return null;

  // Windowed page numbers: 1 … 4 5 6 … 12
  const numbers: Array<number | "…"> = [];
  const windowStart = Math.max(2, page - 1);
  const windowEnd = Math.min(totalPages - 1, page + 1);
  if (page > 1) numbers.push(1);
  if (windowStart > 2) numbers.push("…");
  for (let n = windowStart; n <= windowEnd; n += 1) numbers.push(n);
  if (windowEnd < totalPages - 1) numbers.push("…");
  if (totalPages > 1) numbers.push(totalPages);

  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <button
        type="button"
        className={styles.pageBtn}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        &laquo; Prev
      </button>
      {numbers.map((n, i) =>
        n === "…" ? (
          <span key={`ellipsis-${i}`} className={styles.ellipsis}>
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            className={
              n === page
                ? `${styles.pageBtn} ${styles.pageBtnActive}`
                : styles.pageBtn
            }
            onClick={() => onPageChange(n)}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        className={styles.pageBtn}
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Next &raquo;
      </button>
      <span className={styles.summary}>
        Page {page} of {totalPages}
        {totalCount ? ` · ${totalCount} items` : ""}
      </span>
    </nav>
  );
}

export default Pagination;