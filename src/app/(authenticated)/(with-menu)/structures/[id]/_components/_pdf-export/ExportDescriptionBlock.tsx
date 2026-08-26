import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { useStructureContext } from "@/contexts/StructureContext";

import { AntennesAndContacts } from "../_description/AntennesAndContacts";
import { Codes } from "../_description/Codes";
import { General } from "../_description/General";
import { Historique } from "../_description/Historique";

export const ExportDescriptionBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  return (
    <Block
      title="Description"
      iconClass="fr-icon-align-left"
      entity={structure}
      entityType="Structure"
    >
      <h3 className="text-title-blue-france text-lg mb-3 text-left font-bold">
        Général
      </h3>
      <div className="pb-8">
        <General />
      </div>
      <div className="pb-8">
        <AntennesAndContacts />
      </div>
      <div className="pb-8">
        <Codes />
      </div>
      <h3 className="text-title-blue-france text-lg mb-3 text-left font-bold">
        Historique
      </h3>
      <Historique />
    </Block>
  );
};
