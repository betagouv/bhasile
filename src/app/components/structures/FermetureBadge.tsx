import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
import { formatDate } from "@/app/utils/date.util";

export const FermetureBadge = ({ fermetureDate }: Props) => {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-lifted-grey px-3 py-1 text-sm text-title-blue-france">
      <StructureEventIcon kind="FERMETURE" size="sm" />
      <span>
        Fermée le <strong>{formatDate(fermetureDate ?? undefined)}</strong>
      </span>
    </span>
  );
};

type Props = {
  fermetureDate: string | null;
};
