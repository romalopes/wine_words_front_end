// Domain types for the client-side wine finder (Home page). These records are
// static reference data bundled with the frontend — they are NOT Rails
// resources, so they deliberately live apart from `types/wine.ts` and
// `types/catalog.ts`, which mirror serialized API payloads.

/**
 * The six tasting dimensions the finder scores against. The ids double as the
 * keys of `TasteValues`, so a union keeps `selectedTaste[parameter.id]` typed.
 */
export type TasteParameterId =
  | "acidity"
  | "body"
  | "tannin"
  | "sweetness"
  | "alcohol"
  | "fruit";

/** Slider metadata rendered by the "Describe the glass" panel. */
export interface TasteParameterSpec {
  id: TasteParameterId
  label: string
  low: string
  high: string
  help: string
}

/** A complete set of tasting scores, 1 (low) to 5 (high). */
export type TasteValues = Record<TasteParameterId, number>

/** A concrete bottle-year with a year-specific tasting note. */
export interface VintageSpec {
  year: number
  prompt: string
}

/** Bottle metadata looked up by wine id and merged onto every wine. */
export interface WineDetails {
  closure: string
  alcoholPercentage: number
  volumeMl: number
}

/** A wine style in the generic ("what does this taste like") catalogue. */
export interface WineProfile extends WineDetails {
  id: string
  name: string
  color: string
  grapes: string[]
  regions: string[]
  notes: string[]
  serving: string
  image: string
  parameters: TasteValues
  vintages: VintageSpec[]
}

/** A specific bottle in the Australian quiz (adds region and a prompt). */
export interface AustralianWineTest extends WineDetails {
  id: string
  name: string
  region: string
  color: string
  image: string
  prompt: string
  parameters: TasteValues
  vintages: VintageSpec[]
}

/** A profile scored against the user's current tasting selection. */
export interface ScoredWineProfile extends WineProfile {
  score: number
}

/** Wine colour used to select a placeholder photo. */
export type WineColor = "Red" | "White" | "Rose" | "Sparkling" | "Dessert"
