import { ReactElement } from "react";
import { Control, UseFormRegister } from "react-hook-form";

import UploadWithValidation from "@/app/components/forms/UploadWithValidation";
import { DocumentsFinanciersFlexibleFormValues } from "@/schemas/forms/base/documentFinancier.schema";
import { DocumentFinancierCategory } from "@/types/document-financier.type";

import { UploadItem } from "../../_components/UploadItem";

export const DocumentItem = ({
  year,
  control,
  index,
  register,
  categoryLabel,
  categorySubLabel,
  categoryValue,
}: Props): ReactElement => {
  return (
    <UploadItem
      title={`${categoryLabel} pour ${year}`}
      subTitle={categorySubLabel}
    >
      <UploadWithValidation
        name={`documentsFinanciers.${index}.fileUploads.0.key`}
        id={`documentsFinanciers.${index}.fileUploads.0.key`}
        control={control}
      />
      <input
        type="hidden"
        aria-hidden="true"
        defaultValue={categoryValue}
        {...register(`documentsFinanciers.${index}.category`)}
      />
      <input
        type="hidden"
        aria-hidden="true"
        defaultValue={year}
        {...register(`documentsFinanciers.${index}.year`)}
      />
    </UploadItem>
  );
};

type Props = {
  year: number;
  control: Control<DocumentsFinanciersFlexibleFormValues>;
  index: number;
  register: UseFormRegister<DocumentsFinanciersFlexibleFormValues>;
  categoryLabel: string;
  categorySubLabel?: string;
  categoryValue: DocumentFinancierCategory;
};
