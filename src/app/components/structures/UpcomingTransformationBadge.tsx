import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
import { formatDate } from "@/app/utils/date.util";
import {
  StructureVersionTransformationType,
  UpcomingTransformation,
} from "@/types/transformation.type";

const LABEL_BY_KIND: Record<StructureVersionTransformationType, string> = {
  CREATION: "Ouverture le",
  EXTENSION: "Extension le",
  CONTRACTION: "Contraction le",
  FERMETURE: "Fermeture le",
};

export const UpcomingTransformationBadge = ({
  transformation,
}: Props) => {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-contrast-grey px-3 py-1 text-sm text-title-blue-france">
      <StructureEventIcon kind={transformation.kind} size="sm" />
      <span>
        {LABEL_BY_KIND[transformation.kind]}{" "}
        <strong>{formatDate(transformation.date)}</strong>
      </span>
    </span>
  );
};

type Props = {
  transformation: UpcomingTransformation;
};
