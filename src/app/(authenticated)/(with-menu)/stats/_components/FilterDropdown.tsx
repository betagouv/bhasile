import { PropsWithChildren, useEffect, useRef, useState } from "react";

export const FilterDropdown = ({
  label,
  placeholder = "Sélectionner une...",
  children,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedValue: Option | null = null;

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
      className="w-[200px] border-x border-default-grey relative"
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
              {selectedValue ? (selectedValue as Option).label : placeholder}
            </div>
            <span className="fr-icon-arrow-down-s-line" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bg-white border border-default-grey overflow-y-auto shadow p-2 rounded-xs size-max max-h-[50vh]">
          {children}
        </div>
      )}
    </div>
  );
};

type Props = PropsWithChildren<{
  label: string;
  placeholder?: string;
}>;

export type Option = {
  label: string;
  value: string;
};
