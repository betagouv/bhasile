import Accordion from "@codegouvfr/react-dsfr/Accordion";

import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActesAdministratifsItem } from "./ActesAdministratifsItem";

export const ActesAdministratifsCategory = ({ title, category }: Props) => {
  const { structure } = useStructureContext();

  const actesAdministratifsOfCategory = (
    title === "CPOM"
      ? structure.cpomStructures
          ?.flatMap((cpomStructure) => cpomStructure.cpom?.actesAdministratifs)
          .filter(
            (acteAdministratif) =>
              acteAdministratif && !acteAdministratif?.parentId
          )
      : structure.actesAdministratifs?.filter(
          (acteAdministratif) =>
            acteAdministratif.category === category &&
            !acteAdministratif.parentId
        )
  ) as ActeAdministratifApiType[];

  if (!actesAdministratifsOfCategory?.length) {
    return null;
  }

  return (
    <Accordion label={title ?? category}>
      <div className="grid grid-cols-3 gap-5">
        {actesAdministratifsOfCategory.map((acteAdministratif) => (
          <ActesAdministratifsItem
            key={acteAdministratif.id}
            acteAdministratif={acteAdministratif}
            isCpom={title === "CPOM"}
          />
        ))}
      </div>
    </Accordion>
  );
};

type Props = {
  title: string;
  category: ActeAdministratifCategory;
};
