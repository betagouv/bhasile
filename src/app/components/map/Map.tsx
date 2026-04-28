"use client";

import "maplibre-gl/dist/maplibre-gl.css";
import "carte-facile/carte-facile.css";

import { addOverlay, mapStyles, Overlay } from "carte-facile";
import maplibregl from "maplibre-gl";
import {
  PropsWithChildren,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Root } from "react-dom/client";

import {
  DEFAULT_MAP_ZOOM,
  FRANCE_CENTER,
  FRANCE_MAX_BOUNDS,
  LatLngTuple,
} from "@/constants";

import { MapLibreProvider, MapRegisteredPoint } from "./MapContext";
import { bindStructuresInteractions } from "./structuresInteractions";
import {
  addStructuresLayers,
  addStructuresMarkerImage,
  addStructuresSource,
  STRUCTURES_SOURCE_ID,
} from "./structuresStyle";

type FeatureId = string;

function toLngLat([lat, lng]: LatLngTuple): [number, number] {
  return [lng, lat];
}

export const Map = ({ children }: PropsWithChildren): ReactElement => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [readyMap, setReadyMap] = useState<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const popupRootRef = useRef<Root | null>(null);
  const pointsRef = useRef<globalThis.Map<FeatureId, MapRegisteredPoint>>(
    new globalThis.Map()
  );

  const maxBounds = useMemo(() => {
    const sw = FRANCE_MAX_BOUNDS[0];
    const ne = FRANCE_MAX_BOUNDS[1];
    return [toLngLat(sw), toLngLat(ne)] as [[number, number], [number, number]];
  }, []);

  const center = useMemo(() => toLngLat(FRANCE_CENTER as LatLngTuple), []);

  const getStructureLocations = useCallback((map: maplibregl.Map | null) => {
    if (!map) {
      return;
    }

    let source: maplibregl.GeoJSONSource;
    try {
      source = map.getSource(STRUCTURES_SOURCE_ID) as maplibregl.GeoJSONSource;
    } catch {
      return;
    }

    const features = Array.from(pointsRef.current.values()).map((p) => ({
      type: "Feature" as const,
      properties: { id: p.id },
      geometry: { type: "Point" as const, coordinates: p.lngLat },
    }));

    source.setData({
      type: "FeatureCollection",
      features,
    });
  }, []);

  const registerPoint = useCallback(
    (point: MapRegisteredPoint) => {
      pointsRef.current.set(point.id, point);
      getStructureLocations(readyMap);
      return () => {
        pointsRef.current.delete(point.id);
        getStructureLocations(readyMap);
      };
    },
    [readyMap, getStructureLocations]
  );

  useEffect(() => {
    getStructureLocations(readyMap);
  }, [readyMap, getStructureLocations]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const createdMap = new maplibregl.Map({
      container: containerRef.current,
      style: mapStyles.desaturated,
      center,
      zoom: DEFAULT_MAP_ZOOM,
      maxBounds,
      maxZoom: 18.9,
      fadeDuration: 0,
    });
    mapRef.current = createdMap;

    createdMap.addControl(new maplibregl.NavigationControl(), "top-right");

    createdMap.on("load", async () => {
      addOverlay(createdMap, Overlay.administrativeBoundaries);
      addStructuresSource(createdMap);
      await addStructuresMarkerImage(createdMap);
      addStructuresLayers(createdMap);

      const cleanupInteractions = bindStructuresInteractions({
        map: createdMap,
        pointsRef,
        popupRef,
        popupRootRef,
      });

      getStructureLocations(createdMap);
      setReadyMap(createdMap);

      createdMap.once("remove", () => cleanupInteractions());
    });

    const resizeObserver = new ResizeObserver(() => createdMap.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      popupRootRef.current?.unmount();
      popupRootRef.current = null;
      popupRef.current = null;
      createdMap.remove();
      mapRef.current = null;
      setReadyMap(null);
    };
  }, [center, maxBounds, getStructureLocations]);

  return (
    <div className="h-full w-full z-0">
      <div ref={containerRef} className="h-full w-full" />
      <MapLibreProvider map={readyMap} registerPoint={registerPoint}>
        {children}
      </MapLibreProvider>
    </div>
  );
};
