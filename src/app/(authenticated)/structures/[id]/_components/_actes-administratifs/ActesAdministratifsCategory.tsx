import Accordion from "@codegouvfr/react-dsfr/Accordion";

import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActesAdministratifsItem } from "./ActesAdministratifsItem";

export const ActesAdministratifsCategory = ({ title, category }: Props) => {
  const { structure } = useStructureContext();

  const actesAdministratifsOfCategory = structure.actesAdministratifs?.filter(
    (acteAdministratif) =>
      acteAdministratif.category === category && !acteAdministratif.parentId
  );

  console.log("actesAdministratifsOfCategory", actesAdministratifsOfCategory);
  if (!actesAdministratifsOfCategory?.length) {
    return null;
  }

  return (
    <Accordion label={title}>
      <div className="grid grid-cols-3 gap-5">
        {actesAdministratifsOfCategory.map((acteAdministratif) => (
          <ActesAdministratifsItem
            key={acteAdministratif.id}
            acteAdministratif={acteAdministratif}
          />
        ))}
      </div>
    </Accordion>
  );
};

type Props = {
  title?: string;
  category: ActeAdministratifCategory;
};
