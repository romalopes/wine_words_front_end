import { Link } from "react-router-dom";
import { useReturnTo } from "../hooks/useReturnTo";

export default function BackToSource() {
  const returnTo = useReturnTo();
  if (!returnTo) return null;

  return (
    <Link to={returnTo.path} className="wine-detail__back">
      &larr; Back to {returnTo.label}
    </Link>
  );
}
