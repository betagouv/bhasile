import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { AdditionalFieldsType } from "@/app/utils/acteAdministratif.util";
import { cn } from "@/app/utils/classname.util";
import { getErrorMessages } from "@/app/utils/getErrorMessages.util";

import { formatDateToIsoString } from "@/app/utils/date.util";

import FieldSetActeAdministratif from "../fieldsets/structure/FieldSetActeAdministratif";
import InputWithValidation from "../InputWithValidation";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";

dayjs.extend(customParseFormat);

export const DatesAndDocuments = () => {
  const { watch, control, setValue, formState } = useFormContext();

  const hasErrors = useMemo(
    () => !!formState.errors?.actesAdministratifs,
    [formState.errors]
  );

  const errorMessages = getErrorMessages(formState, "actesAdministratifs");

  const actesAdministratifs = watch(
    "actesAdministratifs"
  ) as ActeAdministratifFormValues[];

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

    const dateStart = formatDateToIsoString(
      actesAdministratifs.find(
        (acteAdministratif) => acteAdministratif.startDate
      )?.startDate
    );

    setValue("dateEnd", dateEnd);
    setValue("dateStart", dateStart);
  }, [actesAdministratifs, actesDatesKey, setValue]);

  return (
    <>
      <div
        className={cn(
          "flex gap-2",
          hasErrors && "border border-solid border-action-high-error rounded-lg"
        )}
      >
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
        <FieldSetActeAdministratif
          category="CONVENTION"
          categoryShortName="CPOM"
          title="CPOM"
          noTitleLegend={true}
          canAddFile={false}
          canAddAvenant={true}
          avenantCanExtendDateEnd={true}
          isOptional={false}
          additionalFieldsType={AdditionalFieldsType.DATE_START_END}
          documentLabel="Document"
          addFileButtonLabel="Ajouter un CPOM"
        />
      </div>
      {hasErrors && (
        <p className="text-default-error m-0 p-0">
          {errorMessages?.length > 0 ? errorMessages[0] : ""}
        </p>
      )}
    </>
  );
};
