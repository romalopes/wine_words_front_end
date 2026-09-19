// Tiny pub/sub so the header bell can react to read-state changes made on the
// Notifications page ("Mark read" / "Mark all read") without lifting state
// into a context or adding polling.
//
// A module-level EventTarget is enough: the bell lives for the whole session
// and only needs to know "something changed, re-check your count".
const NOTIFICATIONS_CHANGED = "notifications:changed";
const target = new EventTarget();

export function emitNotificationsChanged() {
  target.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}

// Returns an unsubscribe function, so callers can clean up in an effect.
export function onNotificationsChanged(callback) {
  target.addEventListener(NOTIFICATIONS_CHANGED, callback);
  return () => target.removeEventListener(NOTIFICATIONS_CHANGED, callback);
}
