import { useMemo, useState } from "react";
import {
  calculateMatch,
  initialTaste,
  tasteParameters,
  wineProfiles,
} from "../data/wineData";
import type { TasteParameterId, TasteValues, WineColor } from "../types/wineFinder";

/** "All" disables the colour filter, so it sits alongside the real colours. */
type ColorFilter = WineColor | "All";

/** A scored profile, ready to render as a suggestion card. */
type ScoredProfile = (typeof wineProfiles)[number] & { score: number };

function Home() {
  const [selectedTaste, setSelectedTaste] = useState<TasteValues>(initialTaste);
  const [selectedColor, setSelectedColor] = useState<ColorFilter>("All");

  const colorOptions: ColorFilter[] = useMemo(
    () => [
      "All",
      ...new Set(wineProfiles.map((profile) => profile.color as WineColor)),
    ],
    [],
  );

  const matches = useMemo<ScoredProfile[]>(() => {
    return wineProfiles
      .filter(
        (profile) => selectedColor === "All" || profile.color === selectedColor,
      )
      .map((profile) => ({
        ...profile,
        score: calculateMatch(profile, selectedTaste),
      }))
      .sort((first, second) => second.score - first.score)
      .slice(0, 4);
  }, [selectedTaste, selectedColor]);

  // `noUncheckedIndexedAccess`: the list can legitimately be empty when the
  // filter matches nothing, so this is absent rather than undefined-by-index.
  const bestMatch = matches[0];

  function handleTasteChange(parameterId: TasteParameterId, value: string) {
    setSelectedTaste((currentTaste) => ({
      ...currentTaste,
      [parameterId]: Number(value),
    }));
  }

  function resetTaste() {
    setSelectedTaste(initialTaste);
    setSelectedColor("All");
  }

  return (
    <main className="wine-app">
      <section className="wine-hero" aria-labelledby="wine-hero-title">
        <div className="wine-hero__content">
          <p className="wine-kicker">Wine finder</p>
          <h1 id="wine-hero-title">Identify a wine from how it tastes.</h1>
          <p>
            Tune the main tasting parameters and get likely wine styles, grapes,
            flavor clues, and food matches. The profile data is structured so it
            can later come from a database or API.
          </p>
        </div>

        <div className="wine-result-highlight" aria-live="polite">
          <span>Best match</span>
          <strong>{bestMatch?.name}</strong>
          <p>{bestMatch?.score}% profile fit</p>
        </div>
      </section>

      <section
        className="wine-workspace"
        aria-label="Wine identification controls and matches"
      >
        <form className="wine-panel wine-controls">
          <div className="section-heading">
            <p>Parameters</p>
            <h2>Describe the glass</h2>
          </div>

          <fieldset className="wine-segmented">
            <legend>Wine color</legend>
            <div>
              {colorOptions.map((color) => (
                <button
                  className={selectedColor === color ? "active" : ""}
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  type="button"
                >
                  {color}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="wine-sliders">
            {tasteParameters.map((parameter) => (
              <label className="wine-slider" key={parameter.id}>
                <span className="wine-slider__top">
                  <strong>{parameter.label}</strong>
                  <output>{selectedTaste[parameter.id]}</output>
                </span>
                <input
                  aria-describedby={`${parameter.id}-help`}
                  max="5"
                  min="1"
                  onChange={(event) =>
                    handleTasteChange(parameter.id, event.target.value)
                  }
                  type="range"
                  value={selectedTaste[parameter.id]}
                />
                <span className="wine-slider__scale">
                  <small>{parameter.low}</small>
                  <small>{parameter.high}</small>
                </span>
                <em id={`${parameter.id}-help`}>{parameter.help}</em>
              </label>
            ))}
          </div>

          <button className="wine-reset" onClick={resetTaste} type="button">
            Reset profile
          </button>
        </form>

        <section
          className="wine-panel wine-matches"
          aria-labelledby="matches-title"
        >
          <div className="section-heading">
            <p>Suggestions</p>
            <h2 id="matches-title">Most likely styles</h2>
          </div>

          <div className="wine-match-list">
            {matches.map((match) => (
              <article className="wine-match" key={match.id}>
                <div className="wine-match__media">
                  <img
                    alt={`${match.name} bottle`}
                    loading="lazy"
                    src={match.image}
                  />
                </div>

                <div className="wine-match__header">
                  <div>
                    <span>{match.color}</span>
                    <h3>{match.name}</h3>
                  </div>
                  <strong>{match.score}%</strong>
                </div>

                <div
                  className="wine-meter"
                  aria-label={`${match.score}% match`}
                >
                  <span style={{ width: `${match.score}%` }} />
                </div>

                <dl>
                  <div>
                    <dt>Grapes</dt>
                    <dd>{match.grapes.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Regions</dt>
                    <dd>{match.regions.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Clues</dt>
                    <dd>{match.notes.join(", ")}</dd>
                  </div>
                </dl>

                <p>{match.serving}</p>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

export default Home;
