import { FiltersDepartement } from "./FiltersDepartement";
import { FiltersReset } from "./FiltersReset";

export const LocationFiltersPanel = ({ closePanel, isActive, ref }: Props) => {
  return (
    <div
      ref={ref}
      className="absolute top-full -right-2 mt-1 w-80 bg-white rounded-md shadow-md z-50"
    >
      <div className="max-h-[50vh] overflow-y-scroll overflow-x-hidden">
        <FiltersDepartement />
        <hr className="p-1!" />
        <FiltersReset
          closePanel={closePanel}
          label="Réinitialiser (toute la France)"
          filters={["departements"]}
          isActive={isActive}
        />
      </div>
    </div>
  );
};

type Props = {
  closePanel: () => void;
  isActive: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
};
