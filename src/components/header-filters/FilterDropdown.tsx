"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { ReactNode, useEffect, useRef, useState } from "react";

import { cn, INCOMPLETE_CHECKBOX_CLASSNAME } from "@/app/utils/classname.util";
import {
  FilterSelection,
  useFilterSelection,
} from "@/hooks/useFilterSelection";

export const FilterDropdown = ({
  label,
  placeholder,
  filterId,
  getSummaryLabel,
  renderOptions,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterSelection = useFilterSelection(filterId);
  const { selection, status, toggleAll, resetCleared } = filterSelection;
  const summaryLabel =
    selection.length === 0 ? undefined : getSummaryLabel(selection);

  const close = () => {
    setIsOpen(false);
    resetCleared();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  });

  return (
    <div
      ref={dropdownRef}
      className="w-50 border-l border-default-grey relative"
    >
      <button
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        className="w-full text-left text-sm "
      >
        <div className="mx-5 my-3">
          <div className="block text-xs font-bold uppercase mb-1 text-mention-grey">
            {label}
          </div>
          <div className="flex">
            <div className="truncate">
              {summaryLabel ? (
                <Tag
                  linkProps={{
                    href: "#",
                  }}
                  small
                  className="pointer-none max-w-full"
                  title={summaryLabel}
                >
                  <span className="truncate">{summaryLabel}</span>
                </Tag>
              ) : (
                placeholder
              )}
            </div>
            <span className="fr-icon-arrow-down-s-line shrink-0" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bg-white border border-default-grey overflow-y-auto shadow p-2 rounded-xs size-max max-h-[50vh] max-w-75">
          <div className="border-b border-default-grey pl-6 pr-3 pt-3 pb-3">
            <Checkbox
              options={[
                {
                  label: placeholder,
                  nativeInputProps: {
                    name: `${filterId}-all`,
                    checked: status !== "none",
                    onChange: toggleAll,
                  },
                },
              ]}
              className={cn(
                "mb-0 [&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0",
                status === "some" && INCOMPLETE_CHECKBOX_CLASSNAME
              )}
              small
            />
          </div>
          {renderOptions(filterSelection)}
        </div>
      )}
    </div>
  );
};

type Props = {
  label: string;
  placeholder: string;
  filterId: string;
  getSummaryLabel: (selection: string[]) => string | undefined;
  renderOptions: (filterSelection: FilterSelection) => ReactNode;
};
