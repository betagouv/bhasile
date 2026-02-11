import Accordion from "@codegouvfr/react-dsfr/Accordion";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { DownloadItem } from "@/app/components/common/DownloadItem";
import { isStructureInCpom } from "@/app/utils/structure.util";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActesAdministratifsBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const categories = [
    {
      label: "Arrêtés d'autorisation",
      // TODO : utiliser l'enum plutôt qu'une string hardcodée
      category: "ARRETE_AUTORISATION",
      isDisplayed: true,
    },
    {
      label: "CPOM",
      category: "CPOM",
      isDisplayed: isStructureInCpom(structure),
    },
    {
      label: "Conventions",
      category: "CONVENTION",
      isDisplayed: true,
    },
    {
      label: "Arrêtés de tarification",
      category: "ARRETE_TARIFICATION",
      isDisplayed: true,
    },
    {
      label: "Autres documents",
      category: "AUTRE",
      isDisplayed: true,
    },
  ];

  const getActesAdministratifsCategoryToDisplay = (categorie: {
    category: string;
  }): ActeAdministratifApiType[] => {
    return (structure.actesAdministratifs || [])
      ?.filter(
        (acteAdministratif) => acteAdministratif.category === categorie.category
      )
      .filter(
        (acteAdministratif) => acteAdministratif.key
      ) as ActeAdministratifApiType[];
  };

  const displayedCategories = categories
    .filter((categorie) => categorie.isDisplayed)
    .filter(
      (categorie) =>
        getActesAdministratifsCategoryToDisplay(categorie)?.length > 0
    );

  return (
    <Block
      title="Actes administratifs"
      iconClass="fr-icon-file-text-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/06-documents`);
      }}
    >
      {displayedCategories.length === 0 ? (
        <>Aucun document importé</>
      ) : (
        displayedCategories.map((categorie) => (
          <Accordion label={categorie.label} key={categorie.category}>
            <div className="columns-3">
              {getActesAdministratifsCategoryToDisplay(categorie).map(
                (acteAdministratif) => (
                  <div key={acteAdministratif.key} className="pb-5">
                    <DownloadItem fileUpload={acteAdministratif} />
                  </div>
                )
              )}
            </div>
          </Accordion>
        ))
      )}
    </Block>
  );
};
