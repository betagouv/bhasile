import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { CustomAccordion } from "@/app/components/common/CustomAccordion";

import { useOperateurContext } from "../_context/OperateurClientContext";
import { DocumentCategory } from "./DocumentCategory";

export const DocumentsBlock = (): ReactElement => {
  const router = useRouter();

  const { operateur } = useOperateurContext();

  return (
    <Block
      title="Documents"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/operateurs/${operateur.id}/modification/documents`);
      }}
      entity={operateur}
      entityType="Operateur"
    >
      <CustomAccordion label="Rapports d'activité">
        <DocumentCategory categoryName="RAPPORT_ACTIVITE" />
      </CustomAccordion>
      <CustomAccordion label="Frais de siège">
        <DocumentCategory categoryName="FRAIS_DE_SIEGE" />
      </CustomAccordion>
      <CustomAccordion label="Statuts">
        <DocumentCategory categoryName="STATUTS" />
      </CustomAccordion>
      <CustomAccordion label="Autres documents">
        <DocumentCategory categoryName="AUTRE" />
      </CustomAccordion>
    </Block>
  );
};
