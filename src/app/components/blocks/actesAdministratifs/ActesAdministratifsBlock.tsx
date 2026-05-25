import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { CategoryDisplayRules } from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { OperateurApiRead } from "@/schemas/api/operateur.schema";
import { StructureApiRead } from "@/schemas/api/structure.schema";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { ActesAdministratifsCategory } from "./ActesAdministratifsCategory";

export const ActesAdministratifsBlock = ({
  structure,
  operateur,
  actesAdministratifs,
  categoriesRules,
  editRoute,
  cpomActesAdministratifs,
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
      title="Actes administratifs"
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
              category={"CONVENTION" as ActeAdministratifCategory}
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
};
