import { Link } from "react-router-dom";
import { producersApi } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { canManageWinesRole } from "../constants/roles";
import usePagedList from "../hooks/usePagedList";
import Pagination from "./Pagination";
import ProducerTable from "./ProducerTable";

function ProducerList() {
  const { user } = useAuth();
  // Admins, Reviewers and Editors may add, edit or delete wines.
  const canManageProducers = canManageWinesRole(user);
  const list = usePagedList({
    fetcher: (params) => producersApi.list(params),
  });

  if (list.loading) {
    return (
      <div className="wine-app">
        <p className="wine-management__loading">Loading producers…</p>
      </div>
    );
  }

  if (list.error) {
    return (
      <div className="wine-app">
        <p className="wine-management__error">{list.error}</p>
        <button className="auth-form__submit" onClick={list.reload}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="wine-app">
      <div className="wine-management__header">
        <div>
          <p className="wine-kicker">Cellar</p>
          <h1>Producers</h1>
        </div>
        {canManageProducers && (
          <Link
            to="/producers/new"
            className="auth-form__submit wine-management__add-btn"
          >
            + Add Producer
          </Link>
        )}
      </div>

      {list.items.length === 0 ? (
        <div className="wine-management__empty">
          <p>No producers found. Start by adding a new producer!</p>
          <Link to="/producers/new" className="auth-form__submit">
            + Add Your First Producer
          </Link>
        </div>
      ) : (
        <>
          <ProducerTable
            producers={list.items}
            canManage={canManageProducers}
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

export default ProducerList;