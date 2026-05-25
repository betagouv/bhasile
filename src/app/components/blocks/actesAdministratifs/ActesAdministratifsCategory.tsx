import Accordion from "@codegouvfr/react-dsfr/Accordion";

import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActesAdministratifsItem } from "./ActesAdministratifsItem";

type Props = {
  title: string;
  category: ActeAdministratifCategory;
  actesAdministratifs: ActeAdministratifApiType[];
  isCpom?: boolean;
};

export const ActesAdministratifsCategory = ({
  title,
  category,
  actesAdministratifs,
  isCpom = false,
}: Props) => {
  const actesAdministratifsOfCategory = isCpom
    ? actesAdministratifs.filter((acte) => !acte.parentId)
    : actesAdministratifs.filter(
        (acte) => acte.category === category && !acte.parentId
      );

  if (!actesAdministratifsOfCategory.length) {
    return null;
  }

  return (
    <Accordion label={title ?? category}>
      <div className="grid grid-cols-3 gap-5">
        {actesAdministratifsOfCategory.map((acteAdministratif) => (
          <ActesAdministratifsItem
            key={acteAdministratif.id}
            acteAdministratif={acteAdministratif}
            allActesAdministratifs={actesAdministratifs}
          />
        ))}
      </div>
    </Accordion>
  );
};
