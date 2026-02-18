import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { DownloadItem } from "@/app/components/common/DownloadItem";
import { getActesAdministratifsCategoryToDisplay } from "@/app/utils/acteAdministratif.util";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const actesAdministratifsCategoriesRules =
    getActesAdministratifsCategoryToDisplay(structure);

  const actesAdministratifsCategories = Object.entries(
    actesAdministratifsCategoriesRules
  )
    .filter(([, rules]) => rules.shouldShow)
    .map(([, rules]) => rules);

  const filteredActesAdministratifs = structure.actesAdministratifs?.filter(
    (acteAdministratif) =>
      Object.keys(actesAdministratifsCategories).includes(
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
          {Object.entries(actesAdministratifsCategories).map(
            ([category, rules]) => {
              const actesAdministratifsOfCategory =
                filteredActesAdministratifs?.filter(
                  (acteAdministratif) => acteAdministratif.category === category
                );
              if (actesAdministratifsOfCategory?.length) {
                return (
                  <Accordion label={rules.title} key={category}>
                    <div className="columns-3">
                      {actesAdministratifsOfCategory.map(
                        (acteAdministratif) => (
                          <div key={acteAdministratif.id} className="pb-5">
                            <DownloadItem item={acteAdministratif} />
                          </div>
                        )
                      )}
                    </div>
                  </Accordion>
                );
              }
              return null;
            }
          )}
          {cpomActesAdministratifs?.length ? (
            <Accordion label="CPOM">
              <div className="columns-3">
                {cpomActesAdministratifs?.map(
                  (acteAdministratif) =>
                    acteAdministratif && (
                      <div key={acteAdministratif.id} className="pb-5">
                        <DownloadItem item={acteAdministratif} />
                      </div>
                    )
                )}
              </div>
            </Accordion>
          ) : null}
        </>
      )}
    </Block>
  );
};
