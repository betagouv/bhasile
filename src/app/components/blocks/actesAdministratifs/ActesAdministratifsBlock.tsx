import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { CategoryDisplayRules } from "@/config/acte-administratif.config";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActesAdministratifsCategory } from "./ActesAdministratifsCategory";

const CPOM_CATEGORY: ActeAdministratifCategory = "CONVENTION";

export const ActesAdministratifsBlock = ({
  structure,
  operateur,
  actesAdministratifs,
  categoriesRules,
  editRoute,
  cpomActesAdministratifs,
  title = "Actes administratifs",
}: Props) => {
  const router = useRouter();

  const filteredActesAdministratifs = actesAdministratifs?.filter(
    (acteAdministratif) =>
      Object.keys(categoriesRules).includes(acteAdministratif.category)
  );

  const hasDocuments =
    cpomActesAdministratifs?.length || filteredActesAdministratifs?.length;

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
          {Object.entries(categoriesRules).map(
            ([category, rules]) =>
              rules.shouldShow && (
                <ActesAdministratifsCategory
                  key={category}
                  category={category as ActeAdministratifCategory}
                  title={rules.title}
                  actesAdministratifs={actesAdministratifs ?? []}
                />
              )
          )}
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
  categoriesRules: CategoryDisplayRules;
  editRoute: string;
  cpomActesAdministratifs?: ActeAdministratifApiType[];
  title: string;
};
