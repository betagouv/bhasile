import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { getActesAdministratifsCategoryToDisplay } from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActesAdministratifsCategory } from "./ActesAdministratifsCategory";

export const ActesAdministratifsBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const actesAdministratifsCategoriesRules =
    getActesAdministratifsCategoryToDisplay(structure);

  const filteredActesAdministratifs = structure.actesAdministratifs?.filter(
    (acteAdministratif) =>
      Object.keys(actesAdministratifsCategoriesRules).includes(
        acteAdministratif.category
      )
  );

  const cpomActesAdministratifs = structure.cpomStructures
    ?.flatMap((cpomStructure) => cpomStructure.cpom?.actesAdministratifs)
    .filter((cpomActeAdministratif) => cpomActeAdministratif);

  const hasDocuments =
    cpomActesAdministratifs?.length || filteredActesAdministratifs?.length;

  return (
    <Block
      title="Actes administratifs"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/06-documents`);
      }}
    >
      {!hasDocuments ? (
        <>Aucun document importé</>
      ) : (
        <>
          {Object.entries(actesAdministratifsCategoriesRules).map(
            ([category, rules]) =>
              rules.shouldShow && (
                <ActesAdministratifsCategory
                  category={category as ActeAdministratifCategory}
                  key={category}
                  title={rules.title}
                />
              )
          )}
          {cpomActesAdministratifs?.length ? (
            <ActesAdministratifsCategory
              category={"CONVENTION" as ActeAdministratifCategory}
              title="CPOM"
            />
          ) : null}
        </>
      )}
    </Block>
  );
};
