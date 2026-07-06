import { StructureTypologieApiType } from "@/schemas/api/structure-typologie.schema";

export const createStructureTypologie = ({
  year,
  ...props
}: Props = {}): StructureTypologieApiType => {
  return {
    id: 1,
    year: year ?? 2023,
    fvvTeh: 5,
    lgbt: 4,
    placesAutorisees: 10,
    pmr: 3,
    ...props,
  };
};

type Props = {
  year?: number;
} & Partial<StructureTypologieApiType>;
