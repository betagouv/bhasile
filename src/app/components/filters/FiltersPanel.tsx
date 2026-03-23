import { FiltersBatis } from "./FiltersBatis";
import { FiltersPlacesAutorisees } from "./FiltersPlacesAutorisees";
import { FiltersReset } from "./FiltersReset";
import { FiltersTypes } from "./FiltersTypes";

export const FiltersPanel = ({ closePanel, isActive, ref }: Props) => {
  return (
    <div
      ref={ref}
      className="absolute top-full -right-2 mt-1 w-96  bg-white rounded-md shadow-md z-50"
    >
      <FiltersTypes />
      <hr className="p-1!" />
      <FiltersBatis />
      <hr className="p-1!" />
      <FiltersPlacesAutorisees />
      <hr className="p-1!" />
      <FiltersReset closePanel={closePanel} isActive={isActive} />
    </div>
  );
};

type Props = {
  closePanel: () => void;
  isActive: boolean;
  ref: React.RefObject<HTMLDivElement | null>;
};
