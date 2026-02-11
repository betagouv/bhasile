import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import FieldSetActeAdministratif from "@/app/components/forms/fieldsets/structure/FieldSetActeAdministratif";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { getActesAdministratifsCategoryToDisplay } from "@/app/utils/acteAdministratif.util";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";

export const ActesAdministratifs = () => {
  const { structure } = useStructureContext();

  const actesAdministratifsCategory =
    getActesAdministratifsCategoryToDisplay(structure);

  return (
    <>
      <MaxSizeNotice />
      {Object.entries(actesAdministratifsCategory)
        .filter(
          (acteAdministratifCategory) => acteAdministratifCategory[1].shouldShow
        )
        .map(([category, rules], index) => {
          return (
            <div key={category}>
              <FieldSetActeAdministratif
                category={category as ActeAdministratifCategory[number]}
                categoryShortName={rules.categoryShortName}
                title={rules.title}
                canAddFile={rules.canAddFile}
                canAddAvenant={rules.canAddAvenant}
                isOptional={rules.isOptional}
                additionalFieldsType={rules.additionalFieldsType}
                documentLabel={rules.documentLabel}
                addFileButtonLabel={rules.addFileButtonLabel}
                notice={rules.notice}
              />
              {index <
                Object.entries(actesAdministratifsCategory).length - 1 && (
                <hr />
              )}
            </div>
          );
        })}
    </>
  );
};
