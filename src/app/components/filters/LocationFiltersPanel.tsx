import { FiltersDepartement } from "./FiltersDepartement";
import { FiltersReset } from "./FiltersReset";

export const LocationFiltersPanel = ({ closePanel, isActive, ref }: Props) => {
  return (
    <div
      ref={ref}
      className="absolute top-full -right-2 mt-1 w-80 bg-white rounded-md shadow-md z-50"
    >
      <FiltersDepartement />
      <hr className="p-1!" />
      <FiltersReset
        closePanel={closePanel}
        label="Réinitialiser (toute la France)"
        filters={["departements"]}
        isActive={isActive}
      />
    </div>
  );
};

type Props = {
  closePanel: () => void;
  isActive: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
};
