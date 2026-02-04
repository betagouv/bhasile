// import { getCategoriesDisplayRules } from "@/app/utils/categoryToDisplay.util";

import { useFormContext } from "react-hook-form";

import InputWithValidation from "../InputWithValidation";

// import UploadsByCategory from "../documents/UploadsByCategory";

export const DatesAndDocuments = () => {
  // const category = "CPOM";

  // const categoriesDisplayRules = getCategoriesDisplayRules();

  const { control } = useFormContext();

  return (
    <div className="flex gap-2">
      <InputWithValidation
        id="dateStart"
        name="dateStart"
        control={control}
        label="Début CPOM"
        type="date"
      />
      <InputWithValidation
        id="dateEnd"
        name="dateEnd"
        control={control}
        label="Fin CPOM"
        type="date"
      />
      {/* <UploadsByCategory
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
      /> */}
    </div>
  );
};
