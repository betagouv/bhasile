"use client";

import maplibregl from "maplibre-gl";

export const STRUCTURES_SOURCE_ID = "structures" as const;
export const STRUCTURES_LAYER_CLUSTERS_ID = "structure-clusters" as const;
export const STRUCTURES_LAYER_CLUSTER_COUNT_ID = "structure-cluster-count" as const;
export const STRUCTURES_LAYER_UNCLUSTERED_ID = "structure-unclustered-point" as const;

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
    type: "circle",
    source: STRUCTURES_SOURCE_ID,
    filter: ["!", ["has", "point_count"]],
    paint: {
      "circle-color": "#000091",
      "circle-radius": 10,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#FFFFFF",
    },
  });
}

