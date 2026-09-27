import { badgeClass, statusLabel, statusTone } from "../constants/winePackages";

// Single source of truth for how a package status looks, so the list, the
// detail page and the notifications list can never disagree. The pill itself
// comes from the shared `.wine-badge` family in index.css, so a status reads
// the same here as anywhere else in the app.
interface PackageStatusBadgeProps {
  /**
   * Nullable: a notification can exist without a package, so a caller may have
   * no status to show at all. `statusLabel` renders a placeholder for that.
   */
  status: string | null | undefined
}

function PackageStatusBadge({ status }: PackageStatusBadgeProps) {
  return <span className={badgeClass(statusTone(status))}>{statusLabel(status)}</span>;
}

export default PackageStatusBadge;
