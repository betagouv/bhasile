import Accordion from "@codegouvfr/react-dsfr/Accordion";

import {
  getActeDisplayCategory,
  hasDownloadableFile,
} from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActesAdministratifsItem } from "./ActesAdministratifsItem";

type Props = {
  title: string;
  category: ActeAdministratifCategory;
  actesAdministratifs: ActeAdministratifApiType[];
  isCpom?: boolean;
  showCpomBadge?: boolean;
};

export const ActesAdministratifsCategory = ({
  title,
  category,
  actesAdministratifs,
  isCpom = false,
  showCpomBadge = true,
}: Props) => {
  const parentActesWithDocument = actesAdministratifs
    .filter((acteAdministratif) => !acteAdministratif.parentId)
    .filter(hasDownloadableFile);

  const actesAdministratifsOfCategory = isCpom
    ? parentActesWithDocument
    : parentActesWithDocument.filter(
        (acteAdministratif) =>
          getActeDisplayCategory(acteAdministratif) === category
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
            showCpomBadge={showCpomBadge}
          />
        ))}
      </div>
    </Accordion>
  );
};
