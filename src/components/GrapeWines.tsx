import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { grapesApi, winesApi } from "../services/api";
import WineTable from "./WineTable";
import Pagination from "./Pagination";
import usePagedList from "../hooks/usePagedList";
import type { Grape } from "../types/catalog";
import type { WineListItem } from "../types/wine";
import type { QueryParams } from "../types/common";

function GrapeWines() {
  const { slug } = useParams<{ slug: string }>();
  const [grape, setGrape] = useState<Grape | null>(null);

  const list = usePagedList<WineListItem>({
    fetcher: (params: QueryParams) =>
      winesApi.list({ ...params, grape_id: grape?.id }),
    enabled: Boolean(grape?.id),
  });

  useEffect(() => {
    if (!slug) return;
    grapesApi
      .show(slug)
      .then(setGrape)
      .catch(() => setGrape(null));
  }, [slug]);

  return (
    <div className="wine-app">
      <Link to="/grapes" className="wine-detail__back">
        &larr; Back to Grapes
      </Link>
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Wines of {grape ? grape.name : "Grape"}</h1>
        </div>
      </div>

      {list.error && (
        <p className="wine-management__error">{list.error}</p>
      )}
      {list.loading ? (
        <p className="wine-management__loading">Loading wines…</p>
      ) : list.items.length === 0 ? (
        <div className="wine-management__empty">
          <p>No wines found for this grape.</p>
        </div>
      ) : (
        <>
          <WineTable
            wines={list.items}
            onDeleted={() => list.reload()}
            linkContext={
              grape
                ? { type: "grape", id: grape.id, name: grape.name }
                : undefined
            }
            onWineLinked={() => list.reload()}
          />
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

export default GrapeWines;
