"use client";

import { ReactElement } from "react";

import { CommunesLayer } from "@/app/components/map/CommunesLayer";
import { Map } from "@/app/components/map/Map";
import { StructuresLayer } from "@/app/components/map/StructuresLayer";
import {
  CommuneMapPoint,
  StructureMapPoint,
} from "@/types/structure-list.type";

const StructuresMap = (props: Props): ReactElement => {
  return (
    <Map>
      {"communes" in props ? (
        <CommunesLayer communes={props.communes} />
      ) : (
        <StructuresLayer points={props.points} />
      )}
    </Map>
  );
};

type Props = { points: StructureMapPoint[] } | { communes: CommuneMapPoint[] };

export default StructuresMap;
