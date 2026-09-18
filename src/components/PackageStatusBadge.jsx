import { statusLabel, statusTone } from "../constants/winePackages";
import styles from "./winePackages.module.css";

const TONE_CLASSES = {
  neutral: styles.badgeNeutral,
  info: styles.badgeInfo,
  warn: styles.badgeWarn,
  ok: styles.badgeOk,
  bad: styles.badgeBad,
};

// Single source of truth for how a package status looks, so the list, the
// detail page and the notifications list can never disagree.
function PackageStatusBadge({ status }) {
  const tone = statusTone(status);

  return (
    <span className={`${styles.badge} ${TONE_CLASSES[tone] || styles.badgeNeutral}`}>
      {statusLabel(status)}
    </span>
  );
}

export default PackageStatusBadge;
