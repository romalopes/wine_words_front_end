// Canonical bottle volumes offered when creating / editing a wine.
// `value` is the integer millilitres stored in the database; `label` is the
// human-readable text shown in selects. 187ml bottles are nominally 187.5ml
// (a champagne split) but stored as 187 so the column stays an integer.
export const VOLUMES = [
  { value: 187, label: "187.5 ml" },
  { value: 250, label: "250 ml" },
  { value: 375, label: "375 ml" },
  { value: 500, label: "500 ml" },
  { value: 750, label: "750 ml" },
  { value: 1000, label: "1 L" },
  { value: 1500, label: "1.5 L" },
  { value: 3000, label: "3 L" },
  { value: 5000, label: "5 L" },
  { value: 6000, label: "6 L" },
  { value: 9000, label: "9 L" },
  { value: 12000, label: "12 L" },
];

// Pre-selected bottle size (ml) for new wines.
export const DEFAULT_VOLUME = 750;

// Required wine attributes that must never be blank. These mirror the
// Rails model defaults (Wine::DEFAULT_COLOR / DEFAULT_CLOSURE /
// DEFAULT_ALCOHOL_PERCENTAGE / DEFAULT_VOLUME) so both apps stay in sync.
export const DEFAULT_COLOR = "White";
export const DEFAULT_CLOSURE = "Cork";
export const DEFAULT_ALCOHOL_PERCENTAGE = 13.5;

// Map a stored integer ml value to its display label (fallback to "<n>ml").
export const volumeLabel = (volume_ml) => {
  if (volume_ml == null) return null;
  const found = VOLUMES.find((v) => v.value === Number(volume_ml));
  return found ? found.label : `${volume_ml}ml`;
};
