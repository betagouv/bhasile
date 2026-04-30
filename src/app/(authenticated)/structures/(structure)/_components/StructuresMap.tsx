"use client";

import { ReactElement } from "react";

import { useStructuresSearch } from "@/app/hooks/useStructuresSearch";

import { Map } from "../../../../components/map/Map";
import { StructureMarker } from "./StructureMarker";

const StructuresMap = (): ReactElement => {
  const { structures } = useStructuresSearch({ map: true });

  return (
    <Map>
      {structures?.map((structure) => (
        <StructureMarker
          id={structure.id}
          coordinates={[
            Number(structure.latitude || 0),
            Number(structure.longitude || 0),
          ]}
          key={structure.id}
        />
      ))}
    </Map>
  );
};

export default StructuresMap;
