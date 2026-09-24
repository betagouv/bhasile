"use client";

import maplibregl from "maplibre-gl";
import { ReactElement, useEffect, useRef } from "react";
import { Root } from "react-dom/client";

import { StructureMapPoint } from "@/types/structure-list.type";

import { useMap } from "./MapContext";
import { closePopup } from "./mapPopup";
import { findGeoJsonSource } from "./mapSource";
import { StructureMarkerContent } from "./StructureMarkerContent";
import { bindStructuresInteractions } from "./structuresInteractions";
import {
  addStructuresImages,
  addStructuresLayers,
  addStructuresSource,
  removeStructuresLayers,
  STRUCTURES_SOURCE_ID,
} from "./structuresStyle";

export const StructuresLayer = ({ points }: Props): ReactElement | null => {
  const map = useMap();
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);

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
    let unbindInteractions: () => void = () => {};

    addStructuresSource(map);
    addStructuresImages(map)
      .then(() => {
        if (isUnmounted || isMapRemoved) {
          return;
        }
        addStructuresLayers(map);
        unbindInteractions = bindStructuresInteractions({
          map,
          renderPopup: (id) => (
            <div className="m-6">
              <StructureMarkerContent id={Number(id)} />
            </div>
          ),
          popupRef,
          popupRootRef,
        });
      })
      .catch((error: unknown) => {
        console.error(
          "Affichage des structures sur la carte impossible",
          error
        );
      });

    return () => {
      isUnmounted = true;
      map.off("remove", markMapRemoved);
      closePopup(popupRef, popupRootRef);
      if (isMapRemoved) {
        return;
      }
      unbindInteractions();
      removeStructuresLayers(map);
    };
  }, [map]);

  useEffect(() => {
    const source = findGeoJsonSource(map, STRUCTURES_SOURCE_ID);
    source?.setData({
      type: "FeatureCollection",
      features: points.map((point) => ({
        type: "Feature",
        properties: { id: String(point.id) },
        geometry: {
          type: "Point",
          coordinates: [Number(point.longitude), Number(point.latitude)],
        },
      })),
    });
  }, [map, points]);

  return null;
};

type Props = {
  points: StructureMapPoint[];
};
