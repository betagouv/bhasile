import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { formatDate } from "@/app/utils/date.util";
import { getOperateurLabel, getRepartition } from "@/app/utils/structure.util";
import { PublicType } from "@/types/structure-public.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ContactsViewer } from "./ContactsViewer";

export const PrahdaDescriptionBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const {
    creationDate,
    dnaCode,
    operateur,
    filiale,
    public: publicType,
  } = structure;

  return (
    <Block title="Description" iconClass="fr-icon-menu-2-fill">
      <div className="flex mb-2">
        <div className="flex-1">
          <strong className="pr-2">Date de création</strong>
          {formatDate(creationDate)}
        </div>
        <div className="flex-1">
          <strong className="pr-2">Type de structure</strong>
          PRAHDA
        </div>
      </div>
      <hr />
      <div className="flex mb-2">
        <div className="flex-1">
          <strong className="pr-2">Code DNA (OFII)</strong>
          {dnaCode}
        </div>
        <div className="flex-1">
          <strong className="pr-2">Opérateur</strong>
          {getOperateurLabel(filiale, operateur?.name)}
        </div>
      </div>
      <hr />
      <div className="flex mb-2">
        <div className="flex-1">
          <strong className="pr-2">Public</strong>
          {publicType
            ? PublicType[publicType as unknown as keyof typeof PublicType]
            : ""}
        </div>
      </div>
      <hr />
      <div className="mb-2">
        <ContactsViewer />
      </div>
      <hr />
      <div className="flex mb-2">
        <strong className="pr-2">Type de bâti</strong>
        <span className="pr-1">{getRepartition(structure)}</span>
      </div>
    </Block>
  );
};
