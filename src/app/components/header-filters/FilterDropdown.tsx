import Badge from "@codegouvfr/react-dsfr/Badge";
import { useSearchParams } from "next/navigation";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

export const FilterDropdown = ({
  label,
  placeholder = "Sélectionner une...",
  filterId,
  children,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const appliedFilters = searchParams.get(filterId)?.split(",").filter(Boolean);

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
              {Number(appliedFilters?.length) > 0 ? (
                <Badge className="rounded" severity="info" small noIcon>
                  {appliedFilters?.length} filtre(s) sélectionné(s)
                </Badge>
              ) : (
                placeholder
              )}
            </div>
            <span className="fr-icon-arrow-down-s-line" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 bg-white border border-default-grey overflow-y-auto shadow p-2 rounded-xs size-max max-h-[50vh] max-w-[300px]">
          {children}
        </div>
      )}
    </div>
  );
};

type Props = PropsWithChildren<{
  label: string;
  placeholder?: string;
  filterId: string;
}>;
