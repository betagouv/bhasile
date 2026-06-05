import InputWithValidation from "./InputWithValidation";

type Props = {
  label: string;
  hintText?: string;
};

export const EffectiveDateInput = ({ label, hintText }: Props) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <InputWithValidation
      name="effectiveDate"
      id="effectiveDate"
      type="date"
      label={label}
      hintText={hintText}
    />
  </div>
);
