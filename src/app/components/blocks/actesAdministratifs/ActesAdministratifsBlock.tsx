import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { getActesCategoriesToDisplay } from "@/app/utils/acteAdministratif.util";
import { ACTE_ADMINISTRATIF_CATEGORY_LABELS } from "@/config/acte-administratif.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActesAdministratifsCategory } from "./ActesAdministratifsCategory";

const CPOM_CATEGORY: ActeAdministratifCategory = "CONVENTION_CPOM";

export const ActesAdministratifsBlock = ({
  structure,
  operateur,
  actesAdministratifs,
  editRoute,
  cpomActesAdministratifs,
  title = "Actes administratifs",
}: Props) => {
  const router = useRouter();

  const categoriesToDisplay = getActesCategoriesToDisplay(actesAdministratifs);

  const hasDocuments =
    cpomActesAdministratifs?.length || categoriesToDisplay.length;

  if (!structure && !operateur) {
    return null;
  }

  return (
    <Block
      title={title}
      iconClass="fr-icon-file-text-line"
      onEdit={() => router.push(editRoute)}
      entity={structure ?? (operateur as OperateurApiRead)}
      entityType={structure ? "Structure" : "Operateur"}
    >
      {!hasDocuments ? (
        <>Aucun document importé</>
      ) : (
        <>
          {categoriesToDisplay.map((category) => (
            <ActesAdministratifsCategory
              key={category}
              category={category}
              title={ACTE_ADMINISTRATIF_CATEGORY_LABELS[category]}
              actesAdministratifs={actesAdministratifs ?? []}
            />
          ))}
          {cpomActesAdministratifs?.length ? (
            <ActesAdministratifsCategory
              category={CPOM_CATEGORY}
              title="CPOM"
              actesAdministratifs={cpomActesAdministratifs}
              isCpom
            />
          ) : null}
        </>
      )}
    </Block>
  );
};

type Props = {
  structure?: StructureApiRead;
  operateur?: OperateurApiRead;
  actesAdministratifs: ActeAdministratifApiType[] | undefined;
  editRoute: string;
  cpomActesAdministratifs?: ActeAdministratifApiType[];
  title?: string;
};
