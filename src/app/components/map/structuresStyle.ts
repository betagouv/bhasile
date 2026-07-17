"use client";

import maplibregl from "maplibre-gl";

import { MAX_MAP_ZOOM } from "@/constants";

const SINGLE_MARKER_IMAGE_ID = "structure-marker";
const SINGLE_MARKER_PUBLIC_PATH = "/structure-marker.svg";
export const STRUCTURES_SOURCE_ID = "structures";
export const STRUCTURES_LAYER_CLUSTERS_ID = "structure-clusters";
export const STRUCTURES_LAYER_UNCLUSTERED_ID = "structure-unclustered-point";

const CLUSTER_SMALL_IMAGE_ID = "structure-cluster-small";
const CLUSTER_MEDIUM_IMAGE_ID = "structure-cluster-medium";
const CLUSTER_LARGE_IMAGE_ID = "structure-cluster-large";

const CLUSTER_FILL_COLOR = "#000091";
const CLUSTER_STROKE_COLOR = "#DDDDDD";
const CLUSTER_STROKE_WIDTH = 2;
const CLUSTER_PIXEL_RATIO = 2;

const addSingleMarkerImage = async (map: maplibregl.Map): Promise<void> => {
  if (map.hasImage(SINGLE_MARKER_IMAGE_ID)) {
    return;
  }

  const img = new Image();
  img.decoding = "async";
  img.src = SINGLE_MARKER_PUBLIC_PATH;

  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () =>
      reject(new Error("Échec du chargement de l'icône du marqueur."));
  });

  map.addImage(SINGLE_MARKER_IMAGE_ID, img);
};

const addClusterCircleImage = (
  map: maplibregl.Map,
  id: string,
  radius: number
): void => {
  if (map.hasImage(id)) {
    return;
  }

  const diameter = (radius + CLUSTER_STROKE_WIDTH) * 2;
  const size = diameter * CLUSTER_PIXEL_RATIO;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Échec de la création de l'icône du cluster.");
  }

  context.scale(CLUSTER_PIXEL_RATIO, CLUSTER_PIXEL_RATIO);
  const center = radius + CLUSTER_STROKE_WIDTH;
  context.beginPath();
  context.arc(center, center, radius, 0, 2 * Math.PI);
  context.fillStyle = CLUSTER_FILL_COLOR;
  context.fill();
  context.lineWidth = CLUSTER_STROKE_WIDTH;
  context.strokeStyle = CLUSTER_STROKE_COLOR;
  context.stroke();

  map.addImage(id, context.getImageData(0, 0, size, size), {
    pixelRatio: CLUSTER_PIXEL_RATIO,
  });
};

export const addStructuresMarkerImage = async (
  map: maplibregl.Map
): Promise<void> => {
  await addSingleMarkerImage(map);
  addClusterCircleImage(map, CLUSTER_SMALL_IMAGE_ID, 18);
  addClusterCircleImage(map, CLUSTER_MEDIUM_IMAGE_ID, 24);
  addClusterCircleImage(map, CLUSTER_LARGE_IMAGE_ID, 30);
};

export const STRUCTURE_MARKER_LAYOUT: maplibregl.SymbolLayerSpecification["layout"] =
  {
    "icon-image": SINGLE_MARKER_IMAGE_ID,
    "icon-size": 1,
    "icon-anchor": "bottom",
    "icon-allow-overlap": true,
  };

export const addStructuresSource = (map: maplibregl.Map): void => {
  map.addSource(STRUCTURES_SOURCE_ID, {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: MAX_MAP_ZOOM,
    clusterRadius: 50,
  });
};

export const STRUCTURES_CLUSTER_FILTER: maplibregl.ExpressionSpecification = [
  "has",
  "point_count",
];

export const addStructuresLayers = (map: maplibregl.Map): void => {
  map.addLayer({
    id: STRUCTURES_LAYER_CLUSTERS_ID,
    type: "symbol",
    source: STRUCTURES_SOURCE_ID,
    filter: STRUCTURES_CLUSTER_FILTER,
    layout: {
      "icon-image": [
        "step",
        ["get", "point_count"],
        CLUSTER_SMALL_IMAGE_ID,
        50,
        CLUSTER_MEDIUM_IMAGE_ID,
        200,
        CLUSTER_LARGE_IMAGE_ID,
      ],
      "icon-allow-overlap": true,
      "text-field": "{point_count_abbreviated}",
      "text-size": 12,
      "text-allow-overlap": true,
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
    layout: STRUCTURE_MARKER_LAYOUT,
  });
};
