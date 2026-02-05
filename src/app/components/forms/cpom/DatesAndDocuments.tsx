import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

import { formatDateToIsoString } from "@/app/utils/date.util";
import { AdditionalFieldsType } from "@/types/categoryToDisplay.type";

import UploadsByCategory, {
  ActeAdministratifField,
} from "../documents/UploadsByCategory";
import InputWithValidation from "../InputWithValidation";

dayjs.extend(customParseFormat);

export const DatesAndDocuments = () => {
  const { watch, control, setValue } = useFormContext();

  const actesAdministratifs = watch(
    "actesAdministratifs"
  ) as ActeAdministratifField[];

  // We use a key to run the useEffect every time the dates change
  const actesDatesKey =
    actesAdministratifs
      ?.map(
        (acteAdministratif) =>
          `${acteAdministratif?.startDate ?? ""}-${acteAdministratif?.endDate ?? ""}`
      )
      .join("|") ?? "";

  useEffect(() => {
    const dateEnd = actesAdministratifs.reduce((accumulator, current) => {
      if (!current.endDate) return accumulator;

      const currentDate = formatDateToIsoString(current.endDate);

      if (!currentDate) return accumulator;

      const accDate = formatDateToIsoString(accumulator);

      if (!accDate) return currentDate;

      return currentDate > accDate ? currentDate : accumulator;
    }, "");

    const dateStart = actesAdministratifs.find(
      (acteAdministratif) => acteAdministratif.startDate
    )?.startDate;

    setValue("dateEnd", dateEnd);
    setValue("dateStart", dateStart);
  }, [actesAdministratifs, actesDatesKey, setValue]);

  console.log("actesAdministratifs", actesAdministratifs);
  console.log("dateEnd", watch("dateEnd"));
  console.log("dateStart", watch("dateStart"));
  return (
    <div className="flex gap-2">
      <InputWithValidation
        id="dateStart"
        name="dateStart"
        control={control}
        label=""
        type="hidden"
      />
      <InputWithValidation
        id="dateEnd"
        name="dateEnd"
        control={control}
        label=""
        type="hidden"
      />
      <UploadsByCategory
        category="CPOM"
        categoryShortName="CPOM"
        title="CPOM"
        canAddFile={false}
        canAddAvenant={true}
        avenantCanExtendDateEnd={true}
        isOptional={false}
        additionalFieldsType={AdditionalFieldsType.DATE_START_END}
        documentLabel="Document"
        addFileButtonLabel="Ajouter un CPOM"
      />
    </div>
  );
};
