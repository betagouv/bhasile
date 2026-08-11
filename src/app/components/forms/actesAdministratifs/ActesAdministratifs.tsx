import FieldSetActeAdministratif from "@/app/components/forms/actesAdministratifs/FieldSetActeAdministratif";
import { AnomalieMessage } from "@/app/components/forms/AnomalieMessage";
import { MaxSizeNotice } from "@/app/components/forms/MaxSizeNotice";
import { CategoryDisplayRules } from "@/config/acte-administratif.config";
import { ActeAdministratifCategory } from "@/types/acte-administratif.type";
import { StructureType } from "@/types/structure.type";

export const ActesAdministratifs = ({
  categoryDisplayRules,
  structureScope,
}: Props) => {
  const filteredCategories = Object.entries(categoryDisplayRules).filter(
    ([, rules]) => rules.shouldShow
  );

  const hasMoreThanOneCategory = filteredCategories.length > 1;

  return (
    <>
      {hasMoreThanOneCategory && <MaxSizeNotice />}
      {filteredCategories.map(([category, rules], index) => (
        <div key={category}>
          <FieldSetActeAdministratif
            category={category as ActeAdministratifCategory}
            categoryShortName={rules.categoryShortName}
            title={rules.title}
            canAddFile={rules.canAddFile}
            canAddAvenant={rules.canAddAvenant}
            avenantCanExtendDateEnd={true}
            isOptional={rules.isOptional}
            additionalFieldsType={rules.additionalFieldsType}
            documentLabel={rules.documentLabel}
            addFileButtonLabel={rules.addFileButtonLabel}
            notice={
              rules.notice ??
              (!hasMoreThanOneCategory ? <MaxSizeNotice /> : undefined)
            }
            alternativeCategories={rules.alternativeCategories}
            avenantAlternative={rules.avenantAlternative}
            structureScope={structureScope}
          />
          {index < filteredCategories.length - 1 && <hr />}
        </div>
      ))}
      <AnomalieMessage id="anomalies-actes" fields={["startDate", "endDate"]} />
    </>
  );
};

type Props = {
  categoryDisplayRules: CategoryDisplayRules;
  structureScope?: StructureType | null;
};
