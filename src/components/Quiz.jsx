import { useState, useEffect, useRef, useCallback } from "react";
import { wineProfilesApi, tasteParametersApi } from "../services/api";

function calculateMatch(selectedWineParameters, tasteParams, selectedTaste) {
  const params = selectedWineParameters || {};
  const totalDistance = tasteParams.reduce((total, param) => {
    return (
      total + Math.abs((params[param.slug] ?? 3) - selectedTaste[param.slug])
    );
  }, 0);
  const maxDistance = tasteParams.length * 4;
  return Math.round((1 - totalDistance / maxDistance) * 100);
}

function Quiz() {
  const [tasteParams, setTasteParams] = useState([]);
  const [loadingParams, setLoadingParams] = useState(true);

  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);

  const [selectedWine, setSelectedWine] = useState(null);
  const [selectedWineParameters, setSelectedWineParameters] = useState({});
  const [testTaste, setTestTaste] = useState({});
  const [hasSubmittedTest, setHasSubmittedTest] = useState(false);

  // Fetch taste parameters from the database
  useEffect(() => {
    async function loadParams() {
      try {
        const data = await tasteParametersApi.list();
        setTasteParams(data);
        const defaults = {};
        data.forEach((p) => {
          defaults[p.slug] = 3;
        });
        setTestTaste(defaults);
      } catch {
        // silently fail
      } finally {
        setLoadingParams(false);
      }
    }
    loadParams();
  }, []);

  // Search using the same API as the main search
  const performSearch = useCallback(async (q) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      setError(null);
      const data = await wineProfilesApi.search(trimmed);
      setSearchResults(data);
    } catch (err) {
      setError(err.message || "Search failed");
      setSearchResults(null);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleInputChange(e) {
    const value = e.target.value;
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => performSearch(value), 300);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      if (timerRef.current) clearTimeout(timerRef.current);
      performSearch(query);
    }
  }

  function selectWine(wine) {
    setSelectedWine(wine);
    const defaults = {};
    tasteParams.forEach((p) => {
      defaults[p.slug] = 3;
    });

    // Seed the target-answer map from the selected wine's stored profile.
    setSelectedWineParameters(() => {
      const targets = {};
      wine.parameters.forEach((p) => {
        targets[p.taste_parameter_slug] = p.score;
      });
      return targets;
    });

    setTestTaste(defaults);
    setHasSubmittedTest(false);
    setSearchResults(null);
    setQuery("");
  }

  function handleTestTasteChange(slug, value) {
    setTestTaste((prev) => ({ ...prev, [slug]: Number(value) }));
    setHasSubmittedTest(false);
  }

  function resetTest() {
    const defaults = {};
    tasteParams.forEach((p) => {
      defaults[p.slug] = 3;
    });
    setTestTaste(defaults);
    setHasSubmittedTest(false);
  }

  const testScore =
    selectedWine && tasteParams.length > 0
      ? calculateMatch(selectedWineParameters, tasteParams, testTaste)
      : 0;

  // Merge wine_profiles and wines from search results
  const allSearchHits = searchResults
    ? [...(searchResults.wine_profiles || []), ...(searchResults.wines || [])]
    : [];

  if (loadingParams) {
    return (
      <main className="wine-app quiz-page">
        <p className="wine-management__loading">Loading quiz…</p>
      </main>
    );
  }

  return (
    <main className="wine-app quiz-page">
      <section className="quiz-hero" aria-labelledby="quiz-title">
        <p className="wine-kicker">Tasting quiz</p>
        <h1 id="quiz-title">Score your read of a wine.</h1>
        <p>
          Pick a wine, set the tasting parameters as you would describe it, then
          compare your profile with the stored target values.
        </p>
      </section>

      <section
        className="wine-panel wine-test"
        aria-labelledby="wine-test-title"
      >
        <div className="section-heading">
          <p>Training mode</p>
          <h2 id="wine-test-title">Wine examples</h2>
        </div>

        <div className="wine-test__intro">
          <div className="wine-test__search-group">
            <label
              className="wine-test__search-label"
              htmlFor="quiz-wine-search"
            >
              <span>Choose a wine</span>
            </label>
            <div className="wine-test__search-wrapper">
              <input
                id="quiz-wine-search"
                className="wine-test__search-input"
                type="text"
                placeholder='e.g. "Shiraz from Barossa"…'
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {searching && (
                <p className="wine-test__search-empty">Searching…</p>
              )}
              {searchResults && allSearchHits.length > 0 && !selectedWine && (
                <div className="wine-test__search-results">
                  {allSearchHits.map((wine) => (
                    <button
                      key={wine.slug || wine.name}
                      type="button"
                      className="wine-test__search-item"
                      onClick={() => selectWine(wine)}
                    >
                      <strong>{wine.name}</strong>
                      <span>
                        {[wine.color, ...(wine.regions || [])]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              {searchResults && allSearchHits.length === 0 && !searching && (
                <p className="wine-test__search-empty">
                  No wines match your search.
                </p>
              )}
            </div>
          </div>

          <article className="wine-test-card">
            {selectedWine ? (
              <>
                <span>
                  {selectedWine.color || "Wine"} ·{" "}
                  {(selectedWine.regions || []).join(", ")}
                </span>
                <h3>{selectedWine.name}</h3>
                {(selectedWine.notes || []).length > 0 && (
                  <p style={{ marginTop: 4, fontSize: "0.85rem" }}>
                    {selectedWine.notes.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <>
                <span>No wine selected</span>
                <h3>Search above</h3>
                <p>Type a wine name or region to begin.</p>
              </>
            )}
          </article>
        </div>

        {error && <p className="auth-form__error">{error}</p>}

        {selectedWine && (
          <div className="wine-test__grid">
            <div className="wine-sliders">
              {tasteParams.map((param) => (
                <label className="wine-slider" key={param.slug}>
                  <span className="wine-slider__top">
                    <strong>{param.label}</strong>
                    <output>{testTaste[param.slug]}</output>
                  </span>
                  <input
                    max="5"
                    min="1"
                    onChange={(event) =>
                      handleTestTasteChange(param.slug, event.target.value)
                    }
                    type="range"
                    value={testTaste[param.slug]}
                  />
                  <span className="wine-slider__scale">
                    <small>{param.low}</small>
                    <small>{param.high}</small>
                  </span>
                </label>
              ))}
            </div>

            <aside className="wine-test-result" aria-live="polite">
              <span>Your accuracy</span>
              <strong>{hasSubmittedTest ? `${testScore}%` : "--"}</strong>
              <p>
                {hasSubmittedTest
                  ? "This compares your parameter set with the stored profile for the selected wine."
                  : "Fill the sliders, then submit your tasting profile."}
              </p>

              {hasSubmittedTest && (
                <dl>
                  {tasteParams.map((param) => (
                    <div key={param.slug}>
                      <dt>{param.label}</dt>
                      <dd>
                        You {testTaste[param.slug]} / Target{" "}
                        {selectedWineParameters?.[param.slug] ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <div className="wine-test-actions">
                <button onClick={() => setHasSubmittedTest(true)} type="button">
                  Check accuracy
                </button>
                <button onClick={resetTest} type="button">
                  Try again
                </button>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default Quiz;
