"use client";

import Spiderfy from "@nazka/map-gl-js-spiderfy";
import maplibregl from "maplibre-gl";
import { RefObject } from "react";
import { Root } from "react-dom/client";

import { MAX_MAP_ZOOM } from "@/constants";

import { MapRegisteredPoint } from "./MapContext";
import { getOrCreatePopup } from "./structuresPopup";
import {
  STRUCTURE_MARKER_LAYOUT,
  STRUCTURES_CLUSTER_FILTER,
  STRUCTURES_LAYER_CLUSTERS_ID,
  STRUCTURES_LAYER_UNCLUSTERED_ID,
  STRUCTURES_SOURCE_ID,
} from "./structuresStyle";

const SPIDERFY_LEAF_LAYER_PREFIX = `${STRUCTURES_LAYER_CLUSTERS_ID}-spiderfy-leaf`;
const SPIDERFY_FIRST_LEAF_LAYER_ID = `${SPIDERFY_LEAF_LAYER_PREFIX}0`;
const SAME_POSITION_EPSILON = 1e-9;

type LngLatTuple = [number, number];

const isNumberPair = (value: unknown): value is [number, number] => {
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
  const openPopup = (id: string, coords: LngLatTuple) => {
    const registered = pointsRef.current?.get(id);
    if (!registered) {
      return;
    }

    const { popup, root } = getOrCreatePopup({ popupRef, popupRootRef });
    root.render(registered.renderPopup());
    popup.setLngLat(coords).addTo(map);
  };

  const findSpiderfyLeafAt = (point: maplibregl.Point) => {
    return map
      .queryRenderedFeatures(point)
      .find((feature) =>
        feature.layer.id.startsWith(SPIDERFY_LEAF_LAYER_PREFIX)
      );
  };

  const getCoordinates = (feature: {
    geometry: unknown;
  }): LngLatTuple | null => {
    const coords = (feature.geometry as { coordinates?: unknown }).coordinates;
    return isNumberPair(coords) ? coords : null;
  };

  let hiddenClusterId: number | null = null;

  const hideCluster = (clusterId: number | null) => {
    if (clusterId === hiddenClusterId) {
      return;
    }
    hiddenClusterId = clusterId;
    map.setFilter(
      STRUCTURES_LAYER_CLUSTERS_ID,
      clusterId === null
        ? STRUCTURES_CLUSTER_FILTER
        : [
            "all",
            STRUCTURES_CLUSTER_FILTER,
            ["!=", ["get", "cluster_id"], clusterId],
          ]
    );
  };

  const syncSpiderfiedCluster = () => {
    if (!map.getLayer(SPIDERFY_FIRST_LEAF_LAYER_ID)) {
      hideCluster(null);
      return;
    }

    const [leaf] = map.querySourceFeatures(SPIDERFY_FIRST_LEAF_LAYER_ID);
    const spiderfied = leaf ? getCoordinates(leaf) : null;
    if (!spiderfied) {
      hideCluster(null);
      return;
    }

    const cluster = map.querySourceFeatures(STRUCTURES_SOURCE_ID).find((f) => {
      if (!f.properties?.cluster) {
        return false;
      }
      const coords = getCoordinates(f);
      return (
        coords !== null &&
        Math.abs(coords[0] - spiderfied[0]) < SAME_POSITION_EPSILON &&
        Math.abs(coords[1] - spiderfied[1]) < SAME_POSITION_EPSILON
      );
    });

    const clusterId = cluster?.properties?.cluster_id;
    hideCluster(typeof clusterId === "number" ? clusterId : null);
  };

  const getLeafAnchor = (
    leaf: maplibregl.MapGeoJSONFeature
  ): LngLatTuple | null => {
    const coordsUnknown = (leaf.geometry as { coordinates?: unknown })
      .coordinates;
    if (!isNumberPair(coordsUnknown)) {
      return null;
    }

    const offset = map.getLayoutProperty(leaf.layer.id, "icon-offset");
    if (!isNumberPair(offset)) {
      return coordsUnknown;
    }

    const projected = map.project(coordsUnknown);
    const anchor = map.unproject([
      projected.x + offset[0],
      projected.y + offset[1],
    ]);
    return [anchor.lng, anchor.lat];
  };

  const spiderfy = new Spiderfy(map, {
    forceSpiderifyMinZoom: MAX_MAP_ZOOM,
    closeOnLeafClick: false,
    spiderLeavesLayout: STRUCTURE_MARKER_LAYOUT,
    spiderLeavesPaint: {},
    onLeafClick: (feature, event) => {
      const rendered = findSpiderfyLeafAt(event.point);
      const anchor = rendered ? getLeafAnchor(rendered) : null;
      openPopup(
        String(feature.properties?.id ?? ""),
        anchor ?? [event.lngLat.lng, event.lngLat.lat]
      );
    },
  });
  spiderfy.applyTo(STRUCTURES_LAYER_CLUSTERS_ID);

  const onUnclusteredClick = (e: maplibregl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      return;
    }

    const coordsUnknown = (feature.geometry as { coordinates?: unknown })
      .coordinates;
    if (!isNumberPair(coordsUnknown)) {
      return;
    }

    openPopup(String(feature.properties?.id ?? ""), coordsUnknown);
  };

  const onMapClick = (event: maplibregl.MapMouseEvent) => {
    if (findSpiderfyLeafAt(event.point)) {
      return;
    }

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

  map.on("idle", syncSpiderfiedCluster);
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
    spiderfy.unspiderfyAll();
    map.off("idle", syncSpiderfiedCluster);
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
