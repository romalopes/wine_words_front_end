import { useCallback, useEffect, useRef, useState } from "react";

type Writing = Record<string, string>;
interface Draft { fields: Writing; savedAt: string }
interface Session {
  key: string | null;
  baseline: string;
  serialized: string;
  dirty: boolean;
  blocked: boolean;
}

/** Local recovery of writing only. Restoring never overwrites server content automatically. */
export function useWritingDraft(key: string | null, fields: Writing) {
  const serialized = JSON.stringify(fields);
  const session = useRef<Session | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [pending, setPending] = useState<Draft | null>(null);
  const [status, setStatus] = useState("Writing is saved automatically on this device.");
  const [decision, setDecision] = useState(0);

  const persist = useCallback((report = true) => {
    const current = session.current;
    if (!current?.key || !current.dirty || current.blocked) return;
    try {
      localStorage.setItem(current.key, JSON.stringify({ fields: JSON.parse(current.serialized), savedAt: new Date().toISOString() }));
      current.dirty = false;
      if (report) setStatus("Writing saved on this device.");
    } catch {
      if (report) setStatus("Could not save writing on this device. Use the form's Save button to keep your work.");
    }
  }, []);

  useEffect(() => {
    if (session.current?.key !== key) {
      persist();
      session.current = { key, baseline: serialized, serialized, dirty: false, blocked: false };
      setPending(null);
      setStatus(key ? "Writing is saved automatically on this device." : "Sign in to enable writing recovery.");
      if (key) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const saved = JSON.parse(raw) as Draft;
            const expectedKeys = Object.keys(JSON.parse(serialized) as Writing);
            if (saved && typeof saved.savedAt === "string" && saved.fields
              && expectedKeys.every((field) => typeof saved.fields[field] === "string")) {
              const recovered = Object.fromEntries(expectedKeys.map((field) => [field, saved.fields[field]!])) as Writing;
              if (JSON.stringify(recovered) !== serialized) {
                session.current.blocked = true;
                setPending({ fields: recovered, savedAt: saved.savedAt });
              }
            }
          }
        } catch {
          setStatus("Writing recovery is unavailable on this device. Save using the form.");
        }
      }
    }
    const current = session.current!;
    if (current.serialized !== serialized) {
      current.serialized = serialized;
      current.dirty = serialized !== current.baseline;
      if (!current.dirty && !current.blocked && current.key) {
        try {
          localStorage.removeItem(current.key);
          setStatus("Writing matches the saved version.");
        } catch {
          setStatus("The local recovery copy could not be removed.");
        }
      }
    }
    clearTimeout(timer.current);
    if (current.dirty && !current.blocked && key) {
      setStatus("Saving writing on this device…");
      timer.current = setTimeout(() => persist(), 750);
    }
    return () => clearTimeout(timer.current);
  }, [key, serialized, decision, persist]);

  useEffect(() => {
    const flush = () => persist(false);
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(timer.current);
      flush();
      window.removeEventListener("pagehide", flush);
    };
  }, [persist]);

  const clear = () => {
    clearTimeout(timer.current);
    const current = session.current;
    if (current) {
      current.blocked = false;
      // This callback belongs to the render that submitted the form. Keep any
      // writing entered while that request was in flight in the recovery copy.
      current.baseline = serialized;
      current.dirty = current.serialized !== serialized;
      if (current.dirty) {
        persist();
      } else {
        try { if (current.key) localStorage.removeItem(current.key); }
        catch { setStatus("Writing saved, but the local recovery copy could not be removed."); }
      }
    }
    setPending(null);
  };
  const resolve = () => {
    if (session.current) session.current.blocked = false;
    setPending(null);
    setDecision((n) => n + 1);
  };
  const discard = () => {
    try { if (key) localStorage.removeItem(key); }
    catch { setStatus("The local recovery copy could not be removed."); }
    resolve();
  };
  return { pending, status, clear, resolve, discard };
}
