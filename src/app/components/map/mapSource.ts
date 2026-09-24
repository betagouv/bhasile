"use client";

import maplibregl from "maplibre-gl";

// maplibre lève une exception si le style n'est pas chargé ou si la carte est détruite.
export const findGeoJsonSource = (
  map: maplibregl.Map | null,
  sourceId: string
): maplibregl.GeoJSONSource | undefined => {
  try {
    return map?.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
  } catch {
    return undefined;
  }
};
