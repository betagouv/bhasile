"use client";

import maplibregl from "maplibre-gl";

export const SINGLE_MARKER_IMAGE_ID = "structure-marker" as const;
export const SINGLE_MARKER_PUBLIC_PATH = "/structure-marker.svg" as const;
export const STRUCTURES_SOURCE_ID = "structures" as const;
export const STRUCTURES_LAYER_CLUSTERS_ID = "structure-clusters" as const;
export const STRUCTURES_LAYER_CLUSTER_COUNT_ID =
  "structure-cluster-count" as const;
export const STRUCTURES_LAYER_UNCLUSTERED_ID =
  "structure-unclustered-point" as const;
export const STRUCTURES_MARKER_IMAGE_ID = SINGLE_MARKER_IMAGE_ID;

async function addSingleMarkerImage(map: maplibregl.Map) {
  if (map.hasImage(SINGLE_MARKER_IMAGE_ID)) {
    return;
  }

  const img = new Image();
  img.decoding = "async";
  img.src = SINGLE_MARKER_PUBLIC_PATH;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to load single marker svg"));
  });

  map.addImage(SINGLE_MARKER_IMAGE_ID, img);
}

export async function addStructuresMarkerImage(map: maplibregl.Map) {
  await addSingleMarkerImage(map);
}

export function addStructuresSource(map: maplibregl.Map) {
  map.addSource(STRUCTURES_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });
}

export function addStructuresLayers(map: maplibregl.Map) {
  map.addLayer({
    id: STRUCTURES_LAYER_CLUSTERS_ID,
    type: "circle",
    source: STRUCTURES_SOURCE_ID,
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#000091",
      "circle-radius": ["step", ["get", "point_count"], 18, 50, 24, 200, 30],
      "circle-stroke-width": 2,
      "circle-stroke-color": "#DDDDDD",
    },
  });

  map.addLayer({
    id: STRUCTURES_LAYER_CLUSTER_COUNT_ID,
    type: "symbol",
    source: STRUCTURES_SOURCE_ID,
    filter: ["has", "point_count"],
    layout: {
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
    },
    paint: {
      "text-color": "#FFFFFF",
    },
  });

  map.addLayer({
    id: STRUCTURES_LAYER_UNCLUSTERED_ID,
    type: "symbol",
    source: STRUCTURES_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": STRUCTURES_MARKER_IMAGE_ID,
      "icon-size": 1,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
    },
  });
}
