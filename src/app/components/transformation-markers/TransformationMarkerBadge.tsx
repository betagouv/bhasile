import { Tooltip } from "@codegouvfr/react-dsfr/Tooltip";
import { Fragment } from "react";

import { StructureEventIcon } from "@/app/components/structures/StructureEventIcon";
import { formatDate } from "@/app/utils/date.util";

import { TransformationMarker } from "./getTransformationMarkers";

const EVENT_LABEL = {
  EXTENSION: "Extension de places",
  CONTRACTION: "Contraction de places",
} as const;

export const TransformationMarkerBadge = ({ marker }: Props) => {
  return (
    <Tooltip
      title={marker.events.map((event, index) => (
        <Fragment key={index}>
          <span className="block font-bold">{formatDate(event.date)}</span>
          <span className="block">{EVENT_LABEL[event.type]}</span>
        </Fragment>
      ))}
    >
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-action-high-blue-france text-white">
        <StructureEventIcon kind={marker.badge} size="sm" />
      </span>
    </Tooltip>
  );
};

type Props = {
  marker: TransformationMarker;
};
