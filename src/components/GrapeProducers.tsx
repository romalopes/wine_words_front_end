import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import usePagedList from "../hooks/usePagedList";
import { grapesApi, producersApi } from "../services/api";
import ProducerTable from "./ProducerTable";
import Pagination from "./Pagination";

// Paginated list of producers for a given grape — mirrors GrapeWines.
function GrapeProducers() {
  const { slug } = useParams();
  const [grape, setGrape] = useState(null);

  useEffect(() => {
    grapesApi
      .show(slug)
      .then(setGrape)
      .catch(() => setGrape(null));
  }, [slug]);

  const producers = usePagedList({
    fetcher: (page) => producersApi.list({ grape_id: grape?.id, page }),
    deps: [grape?.id],
    enabled: Boolean(grape?.id),
    paramKey: "producer_page",
  });

  return (
    <div className="grapes-page">
      <div className="grapes-page__header">
        <h1>Producers</h1>
        <p className="grapes-page__subtitle">
          Producers using this grape ({producers.totalCount ?? "…"} total).
        </p>
      </div>

      {producers.loading ? (
        <p className="grapes-page__loading">Loading producers…</p>
      ) : (
        <>
          <ProducerTable
            producers={producers.items}
            linkContext={{ type: "grape", id: grape?.id }}
            onProducerLinked={() => producers.reload()}
          />
          <Pagination
            page={producers.page}
            totalPages={producers.totalPages}
            totalCount={producers.totalCount}
            onPageChange={producers.setPage}
          />
        </>
      )}
    </div>
  );
}

export default GrapeProducers;
