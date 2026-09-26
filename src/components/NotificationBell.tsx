import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { notificationsApi } from "../services/api";
import { onNotificationsChanged } from "../services/notificationEvents";

// Unread reminders count for the header.
//
// Deliberately a plain fetch rather than `usePagedList`: that hook mirrors the
// page number into the URL, which would rewrite the query string of whatever
// page the header happens to be rendered on.
function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await notificationsApi.list({
          unread: "true",
          page: 1,
          per_page: 1,
        });
        if (cancelled) return;
        // Paginated envelope when `page` is honoured, plain array otherwise.
        const count = Array.isArray(data)
          ? data.length
          : (data.total_count ?? 0);
        setUnread(count);
      } catch {
        // A missing/expired session must never break the header.
        if (!cancelled) setUnread(0);
      }
    }

    load();
    // Read state can change from the Notifications page ("Mark all read"),
    // or backend-side (new reminders, the daily delivery job). Refetch on the
    // app-level signal and when the tab regains focus; the location dependency
    // re-runs this whole block on every route change.
    const unsubscribe = onNotificationsChanged(load);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [location.pathname]);

  return (
    <NavLink
      to="/notifications"
      className="notification-bell"
      aria-label="Notifications"
      title="Notifications"
    >
      <BellIcon />
      {unread > 0 && (
        <span
          className="notification-bell__count"
          aria-label={`${unread} unread`}
        >
          {unread}
        </span>
      )}
    </NavLink>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 22a4 4 0 0 0 4-4h-8a4 4 0 0 0 4 4z" />
      <path d="M18 8a6 6 0 0 1-12 0C6 6.62 6.88 5.44 8 4.58V3a4 4 0 0 1 8 0v1.58C17.12 5.44 18 6.62 18 8z" />
      <circle cx="12" cy="7" r="1.5" fill="currentColor" />
    </svg>
  );
}

export default NotificationBell;
