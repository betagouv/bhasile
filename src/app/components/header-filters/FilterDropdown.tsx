"use client";

import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import Tag from "@codegouvfr/react-dsfr/Tag";
import { ReactNode, useEffect, useRef, useState } from "react";

import {
  FilterSelection,
  useFilterSelection,
} from "@/hooks/useFilterSelection";

export const FilterDropdown = ({
  label,
  placeholder,
  filterId,
  getSummaryLabel,
  children,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const filterSelection = useFilterSelection(filterId);
  const { selection, setSelection } = filterSelection;
  const isAllSelected = selection.length === 0;
  const summaryLabel = isAllSelected ? undefined : getSummaryLabel(selection);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className="w-50 border-l border-default-grey relative"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
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
                  className="pointer-none"
                >
                  {summaryLabel}
                </Tag>
              ) : (
                placeholder
              )}
            </div>
            <span className="fr-icon-arrow-down-s-line" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bg-white border border-default-grey overflow-y-auto shadow p-2 rounded-xs size-max max-h-[50vh] max-w-75">
          <Checkbox
            options={[
              {
                label: placeholder,
                nativeInputProps: {
                  name: `${filterId}-all`,
                  checked: isAllSelected,
                  onChange: () => setSelection([]),
                },
              },
            ]}
            className="border-b border-default-grey px-4 pt-3 pb-1 [&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0"
            small
          />
          {children(filterSelection)}
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
  children: (filterSelection: FilterSelection) => ReactNode;
};
