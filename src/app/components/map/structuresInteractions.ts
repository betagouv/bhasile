"use client";

import maplibregl from "maplibre-gl";
import { RefObject } from "react";
import { Root } from "react-dom/client";

import { MapRegisteredPoint } from "./MapContext";
import { getOrCreatePopup } from "./structuresPopup";
import {
  STRUCTURES_LAYER_CLUSTERS_ID,
  STRUCTURES_LAYER_UNCLUSTERED_ID,
  STRUCTURES_SOURCE_ID,
} from "./structuresStyle";

type LngLatTuple = [number, number];

const isLngLatTuple = (value: unknown): value is LngLatTuple => {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  );
};

export const bindStructuresInteractions = ({
  map,
  pointsRef,
  popupRef,
  popupRootRef,
}: {
  map: maplibregl.Map;
  pointsRef: RefObject<Map<string, MapRegisteredPoint>>;
  popupRef: React.RefObject<maplibregl.Popup | null>;
  popupRootRef: React.RefObject<Root | null>;
}): (() => void) => {
  const onClusterClick = async (e: maplibregl.MapLayerMouseEvent) => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: [STRUCTURES_LAYER_CLUSTERS_ID],
    });
    const first = features[0];
    if (!first) {
      return;
    }

    const clusterIdRaw = first.properties?.cluster_id;
    const clusterId =
      typeof clusterIdRaw === "number" ? clusterIdRaw : undefined;
    if (clusterId == null) {
      return;
    }

    const src = map.getSource(
      STRUCTURES_SOURCE_ID
    ) as maplibregl.GeoJSONSource & {
      getClusterExpansionZoom: (clusterId: number) => Promise<number>;
    };

    const zoom = await src.getClusterExpansionZoom(clusterId);
    const coordsUnknown = (first.geometry as { coordinates?: unknown })
      .coordinates;
    if (!isLngLatTuple(coordsUnknown)) {
      return;
    }
    const coords = coordsUnknown;
    map.easeTo({ center: coords, zoom });
  };

  const onUnclusteredClick = (e: maplibregl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      return;
    }

    const coordsUnknown = (feature.geometry as { coordinates?: unknown })
      .coordinates;
    if (!isLngLatTuple(coordsUnknown)) {
      return;
    }
    const coords = coordsUnknown;

    const id = String(feature.properties?.id ?? "");
    const registered = pointsRef.current?.get(id);
    if (!registered) {
      return;
    }

    const { popup, root } = getOrCreatePopup({ popupRef, popupRootRef });
    root.render(registered.renderPopup());
    popup.setLngLat(coords).addTo(map);
  };

  const onMapClick = (event: maplibregl.MapMouseEvent) => {
    const features = map.queryRenderedFeatures(event.point, {
      layers: [STRUCTURES_LAYER_UNCLUSTERED_ID],
    });
    if (features.length === 0) {
      popupRef.current?.remove();
    }
  };

  const onMouseEnterClusters = () => {
    map.getCanvas().style.cursor = "pointer";
  };
  const onMouseLeaveClusters = () => {
    map.getCanvas().style.cursor = "";
  };

  const onMouseEnterUnclustered = () => {
    map.getCanvas().style.cursor = "pointer";
  };
  const onMouseLeaveUnclustered = () => {
    map.getCanvas().style.cursor = "";
  };

  map.on("click", STRUCTURES_LAYER_CLUSTERS_ID, onClusterClick);
  map.on("click", STRUCTURES_LAYER_UNCLUSTERED_ID, onUnclusteredClick);
  map.on("click", onMapClick);
  map.on("mouseenter", STRUCTURES_LAYER_CLUSTERS_ID, onMouseEnterClusters);
  map.on("mouseleave", STRUCTURES_LAYER_CLUSTERS_ID, onMouseLeaveClusters);
  map.on(
    "mouseenter",
    STRUCTURES_LAYER_UNCLUSTERED_ID,
    onMouseEnterUnclustered
  );
  map.on(
    "mouseleave",
    STRUCTURES_LAYER_UNCLUSTERED_ID,
    onMouseLeaveUnclustered
  );

  return () => {
    map.off("click", STRUCTURES_LAYER_CLUSTERS_ID, onClusterClick);
    map.off("click", STRUCTURES_LAYER_UNCLUSTERED_ID, onUnclusteredClick);
    map.off("click", onMapClick);
    map.off("mouseenter", STRUCTURES_LAYER_CLUSTERS_ID, onMouseEnterClusters);
    map.off("mouseleave", STRUCTURES_LAYER_CLUSTERS_ID, onMouseLeaveClusters);
    map.off(
      "mouseenter",
      STRUCTURES_LAYER_UNCLUSTERED_ID,
      onMouseEnterUnclustered
    );
    map.off(
      "mouseleave",
      STRUCTURES_LAYER_UNCLUSTERED_ID,
      onMouseLeaveUnclustered
    );
  };
};
