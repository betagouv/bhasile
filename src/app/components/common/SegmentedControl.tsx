import { PropsWithChildren, ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";

export const SegmentedControl = ({
  children,
  className,
  name,
  options,
  onChange,
  value,
}: Props): ReactElement => {
  const isControlled = value !== undefined;
  return (
    <fieldset className={cn("fr-segmented fr-segmented--sm", className)}>
      <legend className="fr-segmented__legend fr-segmented__legend--inline">
        {children}
      </legend>
      <div className="fr-segmented__elements m-0">
        {options.map(({ id, isChecked, label, value: optionValue, icon }) => (
          <div className="fr-segmented__element" key={id}>
            <input
              {...(isControlled
                ? { checked: value === optionValue }
                : { defaultChecked: isChecked })}
              id={id}
              name={name}
              type="radio"
              value={optionValue}
              onChange={(event) => onChange?.(event.target.value)}
            />
            <label className={`fr-label ${icon} justify-center`} htmlFor={id}>
              {label}
            </label>
          </div>
        ))}
      </div>
    </fieldset>
  );
};

type Props = PropsWithChildren<
  Readonly<{
    name: string;
    options: ReadonlyArray<{
      id: string;
      isChecked: boolean;
      label: string;
      value: string;
      icon?: string;
    }>;
    onChange?: (visualization: string) => void;
    className?: string;
    value?: string;
  }>
>;
