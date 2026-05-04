"use client";

import { ReactNode } from "react";

import { cn } from "@/app/utils/classname.util";

export default function RadioCardGroup({
  name,
  options,
  value,
  onChange,
  legend,
  required = false,
  disabled = false,
  className,
}: Props) {
  return (
    <fieldset className={cn("border-0 m-0 p-0", className)} disabled={disabled}>
      {legend ? <legend className="fr-label mb-2">{legend}</legend> : null}

      <div className="flex flex-col gap-3">
        {options.map((option) => {
          const id = `${name}-${option.value}`;
          const isSelected = value === option.value;
          const isDisabled = disabled || option.disabled;

          return (
            <div key={option.value}>
              <input
                id={id}
                className="sr-only"
                type="radio"
                name={name}
                value={option.value}
                checked={isSelected}
                disabled={isDisabled}
                required={required}
                onChange={() => onChange?.(option.value)}
              />

              <label
                htmlFor={id}
                className={cn(
                  "block p-4 rounded-sm border-2 transition-colors bg-default-grey-hover",
                  isSelected
                    ? "border-action-high-blue-france"
                    : "border-transparent",
                  isDisabled
                    ? "opacity-60 cursor-not-allowed"
                    : "cursor-pointer hover:bg-default-grey-active",
                  option.className
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 h-5 w-5 rounded-full border-2 shrink-0",
                      isSelected
                        ? "border-action-high-blue-france"
                        : "border-default-grey"
                    )}
                    aria-hidden="true"
                  >
                    <span
                      className={cn(
                        "block h-full w-full rounded-full scale-50",
                        isSelected
                          ? "bg-action-high-blue-france"
                          : "bg-transparent"
                      )}
                    />
                  </span>

                  <span className="flex-1">
                    <span className="block text-title-grey">
                      {option.label}
                    </span>
                    {option.description ? (
                      <span className="block mt-1 text-sm text-mention-grey">
                        {option.description}
                      </span>
                    ) : null}
                  </span>
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
  description?: ReactNode;
  disabled?: boolean;
  className?: string;
};

type Props = {
  name: string;
  options: RadioCardOption[];
  value?: string;
  onChange?: (value: string) => void;
  legend?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
};
