import Accordion from "@codegouvfr/react-dsfr/Accordion";
import Table from "@codegouvfr/react-dsfr/Table";
import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActiviteMotifsIndisponibilite = (): ReactElement => {
  const { structure } = useStructureContext();
  const activite = structure.activites?.[0];

  const getTableData = () => {
    return [
      ["Désinsectisation", activite?.desinsectisation],
      ["Remise en état de l'unité", activite?.remiseEnEtat],
      ["Sous-occupation", activite?.sousOccupation],
      ["Travaux", activite?.travaux],
    ];
  };
  return (
    <Accordion label="Motifs d'indisponibilité" className="custom-accordion">
      <Table
        bordered={true}
        className="full-width-table"
        caption=""
        data={getTableData()}
        headers={["MOTIF", "PLACES CONCERNÉES"]}
      />
    </Accordion>
  );
};
