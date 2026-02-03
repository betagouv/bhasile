import { useFormContext } from "@/app/context/FormContext";
import { getCategoriesDisplayRules } from "@/app/utils/categoryToDisplay.util";

import UploadsByCategory from "../documents/UploadsByCategory";

export const DatesAndDocuments = () => {
  const { watch } = useFormContext();
  const actesAdministratifs = watch("actesAdministratifs");
  const category = "CPOM";

  const categoriesDisplayRules = getCategoriesDisplayRules();

  console.log(actesAdministratifs);
  return (
    <div className="flex flex-col gap-2">
      <UploadsByCategory
        category={category}
        categoryShortName={categoriesDisplayRules[category].categoryShortName}
        title={categoriesDisplayRules[category].title}
        canAddFile={categoriesDisplayRules[category].canAddFile}
        canAddAvenant={categoriesDisplayRules[category].canAddAvenant}
        isOptional={categoriesDisplayRules[category].isOptional}
        additionalFieldsType={
          categoriesDisplayRules[category].additionalFieldsType
        }
        documentLabel={categoriesDisplayRules[category].documentLabel}
        addFileButtonLabel={categoriesDisplayRules[category].addFileButtonLabel}
        notice={categoriesDisplayRules[category].notice}
      />
    </div>
  );
};
