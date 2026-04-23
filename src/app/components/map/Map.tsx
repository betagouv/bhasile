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
import { createRoot, Root } from "react-dom/client";

import { DEFAULT_MAP_ZOOM, FRANCE_CENTER, LatLngTuple } from "@/constants";
import { MapLibreProvider, MapRegisteredPoint } from "./MapLibreContext";
import {
  addStructuresLayers,
  addStructuresSource,
  STRUCTURES_LAYER_CLUSTERS_ID,
  STRUCTURES_LAYER_UNCLUSTERED_ID,
  STRUCTURES_SOURCE_ID,
} from "./structuresStyle";

type LngLatTuple = [number, number];
type FeatureId = string;

const MAX_BOUNDS: [LatLngTuple, LatLngTuple] = [
  [38.976492485539424, -5.9326171875], // SW (lat, lng)
  [53.291489065300226, 9.667968750000002], // NE (lat, lng)
];

function toLngLat([lat, lng]: LatLngTuple): [number, number] {
  return [lng, lat];
}

function isLngLatTuple(v: unknown): v is LngLatTuple {
  return (
    Array.isArray(v) &&
    v.length === 2 &&
    typeof v[0] === "number" &&
    typeof v[1] === "number"
  );
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
    const sw = MAX_BOUNDS[0];
    const ne = MAX_BOUNDS[1];
    return [toLngLat(sw), toLngLat(ne)] as [[number, number], [number, number]];
  }, []);

  const center = useMemo(
    () => toLngLat(FRANCE_CENTER as unknown as LatLngTuple),
    []
  );

  const syncGeoJsonSource = useCallback((m: maplibregl.Map) => {
    let source: maplibregl.GeoJSONSource | undefined;
    try {
      source = m.getSource(STRUCTURES_SOURCE_ID) as
        | maplibregl.GeoJSONSource
        | undefined;
    } catch {
      return;
    }
    if (!source) {
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
      if (readyMap) {
        syncGeoJsonSource(readyMap);
      }
      return () => {
        pointsRef.current.delete(point.id);
        if (readyMap) {
          syncGeoJsonSource(readyMap);
        }
      };
    },
    [readyMap, syncGeoJsonSource]
  );

  useEffect(() => {
    if (!readyMap) {
      return;
    }
    syncGeoJsonSource(readyMap);
  }, [readyMap, syncGeoJsonSource]);

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

    createdMap.on("load", () => {
      addOverlay(createdMap, Overlay.administrativeBoundaries);

      addStructuresSource(createdMap);
      addStructuresLayers(createdMap);

      createdMap.on("click", STRUCTURES_LAYER_CLUSTERS_ID, async (e) => {
        const features = createdMap.queryRenderedFeatures(e.point, {
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

        const src = createdMap.getSource(STRUCTURES_SOURCE_ID) as
          | (maplibregl.GeoJSONSource & {
              getClusterExpansionZoom: (clusterId: number) => Promise<number>;
            })
          | undefined;
        if (!src) {
          return;
        }

        const zoom = await src.getClusterExpansionZoom(clusterId);
        const coordsUnknown = (first.geometry as { coordinates?: unknown })
          .coordinates;
        if (!isLngLatTuple(coordsUnknown)) {
          return;
        }
        const coords = coordsUnknown;
        createdMap.easeTo({ center: coords, zoom });
      });

      createdMap.on("click", STRUCTURES_LAYER_UNCLUSTERED_ID, (e) => {
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
        const registered = pointsRef.current.get(id);

        if (!registered) {
          return;
        }

        if (!popupRef.current) {
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: true,
            maxWidth: "480px",
          });
        }

        if (!popupRootRef.current) {
          const popupContainer = document.createElement("div");
          popupContainer.className = "bhasile-map-popup";
          popupRootRef.current = createRoot(popupContainer);
          popupRef.current.setDOMContent(popupContainer);
        }

        popupRootRef.current.render(
          <div className="bhasile-maplibre-popup-content">
            {registered.renderPopup()}
            <div className="w-xl!" />
          </div>
        );

        popupRef.current.setLngLat(coords).addTo(createdMap);
      });

      createdMap.on("mouseenter", STRUCTURES_LAYER_CLUSTERS_ID, () => {
        createdMap.getCanvas().style.cursor = "pointer";
      });
      createdMap.on("mouseleave", STRUCTURES_LAYER_CLUSTERS_ID, () => {
        createdMap.getCanvas().style.cursor = "";
      });

      createdMap.on("mouseenter", STRUCTURES_LAYER_UNCLUSTERED_ID, () => {
        createdMap.getCanvas().style.cursor = "pointer";
      });
      createdMap.on("mouseleave", STRUCTURES_LAYER_UNCLUSTERED_ID, () => {
        createdMap.getCanvas().style.cursor = "";
      });

      syncGeoJsonSource(createdMap);

      // Expose the map to children only once fully initialized.
      setReadyMap(createdMap);
    });

    const ro = new ResizeObserver(() => createdMap.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      popupRootRef.current?.unmount();
      popupRootRef.current = null;
      popupRef.current = null;
      createdMap.remove();
      mapRef.current = null;
      setReadyMap(null);
    };
  }, [center, maxBounds, syncGeoJsonSource]);

  return (
    <div className="h-full w-full z-0">
      <div ref={containerRef} className="h-full w-full" />
      <MapLibreProvider map={readyMap} registerPoint={registerPoint}>
        {children}
      </MapLibreProvider>
    </div>
  );
};
