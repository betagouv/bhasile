import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";
import { HistoryTimeline } from "./_historique/HistoryTimeline";

export const Historique = (): ReactElement => {
  const { structure } = useStructureContext();
  const history = structure.history ?? [];

  if (history.length === 0) {
    return <p className="fr-text--sm">Aucun historique disponible.</p>;
  }

  return <HistoryTimeline events={history} />;
};
