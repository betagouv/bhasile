import { useFormContext } from "react-hook-form";

import InputWithValidation from "@/app/components/forms/InputWithValidation";

export const DateSelector = () => {
  const { control } = useFormContext();

  return (
    <div className="flex flex-col gap-2">
      <InputWithValidation
        name={`dateStart`}
        id={`dateStart`}
        control={control}
        type="date"
        label="Date de début"
      />
      <InputWithValidation
        name={`dateEnd`}
        id={`dateEnd`}
        control={control}
        type="date"
        label="Date de fin"
      />
    </div>
  );
};
