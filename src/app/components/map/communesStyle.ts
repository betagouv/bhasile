"use client";

import maplibregl from "maplibre-gl";

import {
  CLUSTER_LARGE_IMAGE_ID,
  CLUSTER_MEDIUM_IMAGE_ID,
  CLUSTER_SMALL_IMAGE_ID,
} from "./structuresStyle";

export const COMMUNES_SOURCE_ID = "communes";
export const COMMUNES_LAYER_ID = "communes-places";

const MEDIUM_PLACES_THRESHOLD = 100;
const LARGE_PLACES_THRESHOLD = 500;

// Un regroupement additionne les places de ses communes, jamais un nombre de communes :
// la pastille garde le même sens à tous les niveaux de zoom.
export const addCommunesSource = (map: maplibregl.Map): void => {
  map.addSource(COMMUNES_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterRadius: 50,
    clusterProperties: { places: ["+", ["get", "places"]] },
  });
};

export const addCommunesLayer = (map: maplibregl.Map): void => {
  map.addLayer({
    id: COMMUNES_LAYER_ID,
    type: "symbol",
    source: COMMUNES_SOURCE_ID,
    layout: {
      "icon-image": [
        "step",
        ["get", "places"],
        CLUSTER_SMALL_IMAGE_ID,
        MEDIUM_PLACES_THRESHOLD,
        CLUSTER_MEDIUM_IMAGE_ID,
        LARGE_PLACES_THRESHOLD,
        CLUSTER_LARGE_IMAGE_ID,
      ],
      "icon-allow-overlap": true,
      "text-field": ["to-string", ["get", "places"]],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#FFFFFF",
    },
  });
};

export const removeCommunesLayer = (map: maplibregl.Map): void => {
  if (map.getLayer(COMMUNES_LAYER_ID)) {
    map.removeLayer(COMMUNES_LAYER_ID);
  }
  if (map.getSource(COMMUNES_SOURCE_ID)) {
    map.removeSource(COMMUNES_SOURCE_ID);
  }
};
