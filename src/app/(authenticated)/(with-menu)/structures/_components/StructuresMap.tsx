"use client";

import { ReactElement } from "react";

import { Map } from "@/app/components/map/Map";
import { StructureMarker } from "@/app/components/map/StructureMarker";
import { StructureMapPoint } from "@/types/structure-list.type";

const StructuresMap = ({ points }: Props): ReactElement => {
  return (
    <Map>
      {points.map((point) => (
        <StructureMarker
          id={point.id}
          coordinates={[Number(point.latitude), Number(point.longitude)]}
          key={point.id}
        />
      ))}
    </Map>
  );
};

type Props = {
  points: StructureMapPoint[];
};

export default StructuresMap;
