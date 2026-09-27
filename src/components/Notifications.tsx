import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { notificationsApi } from "../services/api";
import { emitNotificationsChanged } from "../services/notificationEvents";
import usePagedList from "../hooks/usePagedList";
import Pagination from "./Pagination";
import PackageStatusBadge from "./PackageStatusBadge";
import { badgeClass } from "../constants/winePackages";
import { formatDate } from "../utils/dates";
import styles from "./winePackages.module.css";

// The signed-in user's notifications — currently the wine-package review
// deadline reminders. Read state is per-user and the API is scoped to the
// caller, so nothing here needs to filter by recipient.
function Notifications() {
  const [searchParams, setSearchParams] = useSearchParams();
  const unreadOnly = searchParams.get("unread") === "true";
  const [busy, setBusy] = useState(false);

  const list = usePagedList({
    fetcher: (params) => notificationsApi.list(params),
    extraParams: { unread: unreadOnly ? "true" : "" },
  });

  function toggleUnread(next) {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("unread", "true");
    else params.delete("unread");
    params.delete("page");
    setSearchParams(params);
  }

  async function markRead(notification) {
    setBusy(true);
    try {
      await notificationsApi.markRead(notification.id);
      list.reload();
      emitNotificationsChanged();
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await notificationsApi.markAllRead();
      list.reload();
      emitNotificationsChanged();
    } finally {
      setBusy(false);
    }
  }

  if (list.loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading notifications…</p>
      </div>
    );
  }

  if (list.error) {
    return (
      <div className="wine-app">
        <p className="wine-management__error">{list.error}</p>
        <button className="wine-btn wine-btn--primary" onClick={list.reload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="wine-app">
      <div className={styles.header}>
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Notifications</h1>
          <p className={styles.cellMuted}>
            Review-deadline reminders for the wine packages you are responsible
            for.
          </p>
        </div>
        <div className={styles.headerActions}>
          <label
            className={styles.checkboxField}
            htmlFor="notifications-unread"
          >
            <input
              id="notifications-unread"
              type="checkbox"
              checked={unreadOnly}
              onChange={(event) => toggleUnread(event.target.checked)}
            />
            Unread only
          </label>
          <button
            type="button"
            className="wine-btn wine-btn--secondary"
            disabled={busy}
            onClick={markAllRead}
          >
            Mark all read
          </button>
        </div>
      </div>

      {list.items.length === 0 ? (
        <div className="wine-management__empty">
          <p>{unreadOnly ? "Nothing unread. " : "No notifications yet. "}</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">When</th>
                  <th scope="col">Message</th>
                  <th scope="col">Package</th>
                  <th scope="col">Status</th>
                  <th scope="col">
                    <span className="visually-hidden">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.items.map((notification) => (
                  <tr key={notification.id}>
                    <td className={styles.cellMuted}>
                      {formatDate(notification.scheduled_date)}
                      {!notification.sent && <div>not sent yet</div>}
                    </td>
                    <td>
                      {notification.message}
                      {!notification.read && (
                        <span className={badgeClass("info")}>Unread</span>
                      )}
                    </td>
                    <td>
                      {notification.wine_package_id ? (
                        <Link
                          to={`/wine-packages/${notification.wine_package_id}`}
                        >
                          {notification.producer_name ||
                            `Package #${notification.wine_package_id}`}
                        </Link>
                      ) : (
                        <span className={styles.cellMuted}>—</span>
                      )}
                    </td>
                    <td>
                      <PackageStatusBadge
                        status={notification.package_status}
                      />
                    </td>
                    <td>
                      {!notification.read && (
                        <button
                          type="button"
                          className="wine-btn wine-btn--ghost wine-btn--sm"
                          disabled={busy}
                          onClick={() => markRead(notification)}
                        >
                          Mark read
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={list.page}
            totalPages={list.totalPages}
            totalCount={list.totalCount}
            onPageChange={list.setPage}
          />
        </>
      )}
    </div>
  );
}

export default Notifications;
