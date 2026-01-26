import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";

export const DateSelector = () => {
  const { control } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <InputWithValidation
        name={`yearStart`}
        id={`yearStart`}
        control={control}
        type="date"
        label="Date de début"
      />
      <InputWithValidation
        name={`yearEnd`}
        id={`yearEnd`}
        control={control}
        type="date"
        label="Date de fin"
      />
    </div>
  );
};
