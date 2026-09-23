"use client";

import { ReactElement } from "react";

import { Map } from "@/app/components/map/Map";
import { StructuresLayer } from "@/app/components/map/StructuresLayer";
import { StructureMapPoint } from "@/types/structure-list.type";

const StructuresMap = ({ points }: Props): ReactElement => {
  return (
    <Map>
      <StructuresLayer points={points} />
    </Map>
  );
};

type Props = {
  points: StructureMapPoint[];
};

export default StructuresMap;
