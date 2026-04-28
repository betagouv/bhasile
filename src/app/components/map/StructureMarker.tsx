"use client";

import { useEffect, useMemo } from "react";

import { useRegisterMapPoint } from "@/app/components/map/MapContext";

import { StructureMarkerContent } from "./StructureMarkerContent";

export const StructureMarker = ({ id, coordinates }: Props): null => {
  const registerPoint = useRegisterMapPoint();

  const lngLat = useMemo<[number, number]>(() => {
    const [lat, lng] = coordinates;
    return [lng, lat];
  }, [coordinates]);

  useEffect(() => {
    return registerPoint({
      id: String(id),
      lngLat,
      renderPopup: () => (
        <div className="bhasile-maplibre-popup-content">
          <StructureMarkerContent id={id} />
        </div>
      ),
    });
  }, [id, lngLat, registerPoint]);

  return null;
};

type Props = {
  id: number;
  coordinates: [number, number];
};
