import "trix/dist/trix.css";

let loading: Promise<void> | undefined;

export function loadTrix(): Promise<void> {
  loading ??= import("trix").then(() => undefined).catch((error: unknown) => {
    loading = undefined;
    throw error;
  });
  return loading;
}
