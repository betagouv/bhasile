import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";

import { SegmentedControl } from "@/app/components/common/SegmentedControl";
import { formatDateToIsoString } from "@/app/utils/date.util";
import { getErrorMessages } from "@/app/utils/getErrorMessages.util";
import { AdditionalFieldsType } from "@/config/acte-administratif.config";
import { getCpomActesAdministratifsCategoryToDisplay } from "@/config/cpom-acte-administratif.config";
import { ActeAdministratifFormValues } from "@/schemas/forms/base/acteAdministratif.schema";
import { StructureType } from "@/types/structure.type";

import { ActesAdministratifs } from "../actesAdministratifs/ActesAdministratifs";
import FieldSetActeAdministratif from "../actesAdministratifs/FieldSetActeAdministratif";
import InputWithValidation from "../InputWithValidation";
import { MaxSizeNotice } from "../MaxSizeNotice";

dayjs.extend(customParseFormat);

const CPOM_SCOPE = "CPOM";

export const DatesAndDocuments = ({ structureTypes }: Props) => {
  const { watch, control, setValue, formState } = useFormContext();

  const [currentScope, setCurrentScope] = useState<StructureType | null>(null);

  const errorMessages = getErrorMessages(formState, "actesAdministratifs");

  const actesAdministratifs = watch(
    "actesAdministratifs"
  ) as ActeAdministratifFormValues[];

  // We use a key to run the useEffect every time the dates change
  const actesDatesKey =
    actesAdministratifs
      ?.filter(
        (acteAdministratif) => acteAdministratif?.category === "CONVENTION_CPOM"
      )
      .map(
        (acteAdministratif) =>
          `${acteAdministratif?.startDate ?? ""}-${acteAdministratif?.endDate ?? ""}`
      )
      .join("|") ?? "";

  useEffect(() => {
    const conventionActes = actesAdministratifs.filter(
      (acteAdministratif) => acteAdministratif?.category === "CONVENTION_CPOM"
    );

    const dateEnd = conventionActes.reduce((accumulator, current) => {
      if (!current.endDate) {
        return accumulator;
      }

      const currentDate = formatDateToIsoString(current.endDate);

      if (!currentDate) {
        return accumulator;
      }

      const accDate = formatDateToIsoString(accumulator);

      if (!accDate) {
        return currentDate;
      }

      return currentDate > accDate ? currentDate : accumulator;
    }, "");

    const dateStart = formatDateToIsoString(
      conventionActes.find((acteAdministratif) => acteAdministratif.startDate)
        ?.startDate
    );

    setValue("dateEnd", dateEnd);
    setValue("dateStart", dateStart);
  }, [actesAdministratifs, actesDatesKey, setValue]);

  return (
    <>
      {structureTypes.length > 0 && (
        <SegmentedControl
          name="cpomDocumentScope"
          options={[
            {
              id: CPOM_SCOPE,
              label: CPOM_SCOPE,
              value: CPOM_SCOPE,
              isChecked: currentScope === null,
            },
            ...structureTypes.map((structureType) => ({
              id: structureType,
              label: structureType,
              value: structureType,
              isChecked: currentScope === structureType,
            })),
          ]}
          onChange={(value) =>
            setCurrentScope(
              value === CPOM_SCOPE ? null : (value as StructureType)
            )
          }
          className="mb-6"
        />
      )}
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
      </div>
      {currentScope === null ? (
        <>
          <FieldSetActeAdministratif
            category="CONVENTION_CPOM"
            categoryShortName="CPOM"
            title="Contrat CPOM"
            canAddFile={false}
            canAddAvenant={true}
            avenantCanExtendDateEnd={true}
            isOptional={false}
            additionalFieldsType={AdditionalFieldsType.DATE_START_END}
            documentLabel="Document"
            addFileButtonLabel="Ajouter un CPOM"
            notice={<MaxSizeNotice className="mb-0" />}
            structureScope={null}
          />
          <FieldSetActeAdministratif
            category="AUTRE"
            categoryShortName="autre"
            title="Autres documents"
            canAddFile={true}
            canAddAvenant={false}
            isOptional={true}
            additionalFieldsType={AdditionalFieldsType.NAME}
            documentLabel="Document"
            addFileButtonLabel="Ajouter un document"
            notice={<MaxSizeNotice className="mb-0" />}
            structureScope={null}
          />
        </>
      ) : (
        <ActesAdministratifs
          categoryDisplayRules={getCpomActesAdministratifsCategoryToDisplay(
            currentScope
          )}
          structureScope={currentScope}
        />
      )}
      {errorMessages?.length > 0 && (
        <p className="text-default-error m-0 p-0" data-form-error>
          {errorMessages?.length ? errorMessages[0] : ""}
        </p>
      )}
    </>
  );
};

type Props = {
  structureTypes: StructureType[];
};
