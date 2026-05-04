"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";

export default function RadioCardGroup({
  name,
  options,
  value,
  onChange,
  className,
}: Props) {
  if (value) {
    const selectedOption = options.find((option) => option.value === value);
    if (!selectedOption) {
      return null;
    }
    return (
      <label className="py-3 px-6 rounded-sm flex justify-between items-center">
        <div className="flex items-start gap-3">
          <span className="block h-5 w-5 fr-icon-check-line text-action-high-blue-france" />
          <span className="flex-1 text-action-high-blue-france">
            {selectedOption.label}
          </span>
        </div>
        <Button
          priority="tertiary no outline"
          iconId="fr-icon-arrow-go-back-line"
          onClick={() => onChange?.(undefined)}
        >
          Modifier
        </Button>
      </label>
    );
  }

  return (
    <fieldset className={className}>
      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const isSelected = value === option.value;

          return (
            <div key={option.value}>
              <input
                id={id}
                className="sr-only"
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => onChange?.(option.value)}
              />

              <label
                htmlFor={id}
                className={cn(
                  "block px-6 py-3 rounded-sm bg-default-grey-hover"
                )}
              >
                <div className="flex items-center gap-3 min-h-10">
                  <span
                    className="mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 border-action-high-blue-france"
                    aria-hidden="true"
                  />

                  <span className="flex-1 text-title-grey">{option.label}</span>
                </div>
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export type RadioCardOption = {
  value: string;
  label: ReactNode;
};

type Props = {
  name: string;
  options: RadioCardOption[];
  value?: string;
  onChange?: (value: string | undefined) => void;
  className?: string;
};
