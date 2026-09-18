import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { notificationsApi } from "../services/api";

// Unread reminders count for the header.
//
// Deliberately a plain fetch rather than `usePagedList`: that hook mirrors the
// page number into the URL, which would rewrite the query string of whatever
// page the header happens to be rendered on.
function NotificationBell() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await notificationsApi.list({ unread: "true", page: 1, per_page: 1 });
        if (cancelled) return;
        // Paginated envelope when `page` is honoured, plain array otherwise.
        const count = Array.isArray(data) ? data.length : data.total_count ?? 0;
        setUnread(count);
      } catch {
        // A missing/expired session must never break the header.
        if (!cancelled) setUnread(0);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <NavLink to="/notifications" className="notification-bell" aria-label="Notifications">
      Notifications
      {unread > 0 && <span className="notification-bell__count">{unread}</span>}
    </NavLink>
  );
}

export default NotificationBell;
