import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { CustomAccordion } from "@/app/components/common/CustomAccordion";

import { useOperateurContext } from "../_context/OperateurClientContext";

export const DocumentsBlock = (): ReactElement => {
  const { operateur } = useOperateurContext();

  return (
    <Block
      title="Documents"
      iconClass="fr-icon-file-text-line"
      entity={operateur}
      entityType="Operateur"
    >
      <CustomAccordion label="Rapports d'activité">
        <div className="m-4">Aucun document importé</div>
      </CustomAccordion>
      <CustomAccordion label="Frais de siège">
        <div className="m-4">Aucun document importé</div>
      </CustomAccordion>
      <CustomAccordion label="Statuts">
        <div className="m-4">Aucun document importé</div>
      </CustomAccordion>
      <CustomAccordion label="Autres documents">
        <div className="m-4">Aucun document importé</div>
      </CustomAccordion>
    </Block>
  );
};
