import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { producersApi, winesApi } from "../services/api";
import WineTable from "./WineTable";

function ProducerWines() {
  const { slug } = useParams();
  const [producer, setProducer] = useState(null);
  const [wines, setWines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function loadWines() {
    try {
      setLoading(true);
      setError(null);
      const [producerData, winesData] = await Promise.all([
        producersApi.show(slug),
        winesApi.list(),
      ]);
      setProducer(producerData);
      const allWines = Array.isArray(winesData) ? winesData : [];
      setWines(
        allWines.filter((wine) => wine.producer && wine.producer.slug === slug),
      );
    } catch (err) {
      setError(err.message || "Failed to load wines");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading wines…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="wine-app">
        <p className="wine-management__error">{error}</p>
        <button className="auth-form__submit" onClick={loadWines}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="wine-app">
      <Link to="/producers" className="wine-detail__back">
        &larr; Back to Producers
      </Link>
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Wines of {producer ? producer.name : "Producer"}</h1>
        </div>
      </div>

      {wines.length === 0 ? (
        <div className="wine-management__empty">
          <p>No wines found for this producer.</p>
        </div>
      ) : (
        <WineTable
          wines={wines}
          onDeleted={(deleted) =>
            setWines((prev) => prev.filter((w) => w.slug !== deleted.slug))
          }
          linkContext={{
            type: "producer",
            id: producer.id,
            name: producer.name,
          }}
          onWineLinked={() => {
            producersApi
              .show(producer.slug)
              .then((p) => setWines(p.wines))
              .catch(() => {});
          }}
        />
      )}
    </div>
  );
}

export default ProducerWines;
