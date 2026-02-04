import { PropsWithChildren, ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";

export const SegmentedControl = ({
  children,
  className,
  name,
  options,
  onChange,
}: Props): ReactElement => {
  return (
    <fieldset className={cn("fr-segmented fr-segmented--sm", className)}>
      <legend className="fr-segmented__legend fr-segmented__legend--inline">
        {children}
      </legend>
      <div className="fr-segmented__elements m-0">
        {options.map(({ id, isChecked, label, value, icon }) => (
          <div className="fr-segmented__element" key={id}>
            <input
              defaultChecked={isChecked}
              id={id}
              name={name}
              type="radio"
              value={value}
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
  }>
>;
