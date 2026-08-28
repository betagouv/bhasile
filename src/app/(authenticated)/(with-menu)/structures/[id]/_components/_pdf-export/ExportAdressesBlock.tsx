import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { useStructureContext } from "@/contexts/StructureContext";

import { Adresses } from "../_description/Adresses";

export const ExportAdressesBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  return (
    <Block
      title="Adresses d'hébergement"
      iconClass="fr-icon-home-4-line"
      entity={structure}
      entityType="Structure"
    >
      <Adresses />
    </Block>
  );
};
