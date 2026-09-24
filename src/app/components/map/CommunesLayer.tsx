"use client";

import maplibregl from "maplibre-gl";
import { useEffect, useRef } from "react";
import { Root } from "react-dom/client";

import { CommuneMapPoint } from "@/types/structure-list.type";

import { CommunePopupContent } from "./CommunePopupContent";
import {
  addCommunesLayer,
  addCommunesSource,
  COMMUNES_LAYER_ID,
  COMMUNES_SOURCE_ID,
  removeCommunesLayer,
} from "./communesStyle";
import { useMap } from "./MapContext";
import { closePopup, getOrCreatePopup } from "./mapPopup";
import { findGeoJsonSource } from "./mapSource";
import { addClusterCircleImages } from "./structuresStyle";

export const CommunesLayer = ({ communes }: Props): null => {
  const map = useMap();
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const communesByKeyRef = useRef(new Map<string, CommuneMapPoint>());

  useEffect(() => {
    if (!map) {
      return;
    }

    // React nettoie la carte parente avant ses couches : une fois la carte détruite,
    // il ne reste plus rien à retirer.
    let isMapRemoved = false;
    const markMapRemoved = () => {
      isMapRemoved = true;
    };
    map.once("remove", markMapRemoved);
    let isUnmounted = false;

    addClusterCircleImages(map);
    addCommunesSource(map);
    addCommunesLayer(map);

    const openCommunePopup = (
      commune: CommuneMapPoint,
      coordinates: [number, number]
    ) => {
      const { popup, root } = getOrCreatePopup({ popupRef, popupRootRef });
      root.render(
        <div className="m-6">
          <CommunePopupContent commune={commune} />
        </div>
      );
      popup.setLngLat(coordinates).addTo(map);
    };

    const onCommuneClick = (event: maplibregl.MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (feature?.geometry.type !== "Point") {
        return;
      }
      const coordinates = feature.geometry.coordinates as [number, number];

      if (feature.properties?.cluster) {
        findGeoJsonSource(map, COMMUNES_SOURCE_ID)
          ?.getClusterExpansionZoom(feature.properties.cluster_id)
          .then((zoom) => {
            if (!isUnmounted && !isMapRemoved) {
              map.easeTo({ center: coordinates, zoom });
            }
          })
          // Source retirée entre le clic et la réponse (changement de mode) : rien à zoomer.
          .catch(() => {});
        return;
      }

      const commune = communesByKeyRef.current.get(
        String(feature.properties?.key)
      );
      if (commune) {
        openCommunePopup(commune, coordinates);
      }
    };

    const onMapClick = (event: maplibregl.MapMouseEvent) => {
      const clickedCommunes = map.queryRenderedFeatures(event.point, {
        layers: [COMMUNES_LAYER_ID],
      });
      if (clickedCommunes.length === 0) {
        popupRef.current?.remove();
      }
    };

    const setPointerCursor = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    map.on("click", COMMUNES_LAYER_ID, onCommuneClick);
    map.on("click", onMapClick);
    map.on("mouseenter", COMMUNES_LAYER_ID, setPointerCursor);
    map.on("mouseleave", COMMUNES_LAYER_ID, resetCursor);

    return () => {
      isUnmounted = true;
      map.off("remove", markMapRemoved);
      closePopup(popupRef, popupRootRef);
      if (isMapRemoved) {
        return;
      }
      map.off("click", COMMUNES_LAYER_ID, onCommuneClick);
      map.off("click", onMapClick);
      map.off("mouseenter", COMMUNES_LAYER_ID, setPointerCursor);
      map.off("mouseleave", COMMUNES_LAYER_ID, resetCursor);
      removeCommunesLayer(map);
    };
  }, [map]);

  useEffect(() => {
    // Une popup ouverte décrirait une commune calculée avec les anciens filtres.
    popupRef.current?.remove();
    communesByKeyRef.current = new Map(
      communes.map((commune) => [commune.key, commune])
    );
    findGeoJsonSource(map, COMMUNES_SOURCE_ID)?.setData({
      type: "FeatureCollection",
      features: communes.map((commune) => ({
        type: "Feature",
        properties: { key: commune.key, places: commune.places },
        geometry: {
          type: "Point",
          coordinates: [commune.longitude, commune.latitude],
        },
      })),
    });
  }, [map, communes]);

  return null;
};

type Props = {
  communes: CommuneMapPoint[];
};
