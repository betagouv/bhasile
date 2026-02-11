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

  const actesAdministratifsCategories =
    getActesAdministratifsCategoryToDisplay(structure);

  const filteredActesAdministratifs = structure.actesAdministratifs?.filter(
    (acteAdministratif) =>
      Object.keys(actesAdministratifsCategories).includes(
        acteAdministratif.category
      )
  );

  return (
    <Block
      title="Actes administratifs"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/06-documents`);
      }}
    >
      {structure.actesAdministratifs?.length === 0 ? (
        <>Aucun document importé</>
      ) : (
        Object.entries(actesAdministratifsCategories).map(
          ([category, rules]) => (
            <Accordion label={rules.title} key={category}>
              <div className="columns-3">
                {filteredActesAdministratifs
                  ?.filter(
                    (acteAdministratif) =>
                      acteAdministratif.category === category
                  )
                  .map((acteAdministratif) => (
                    <div key={acteAdministratif.id} className="pb-5">
                      <DownloadItem item={acteAdministratif} />
                    </div>
                  ))}
              </div>
            </Accordion>
          )
        )
      )}
    </Block>
  );
};
