"use client";

import maplibregl from "maplibre-gl";
import { createContext, ReactNode, useContext } from "react";

export type MapRegisteredPoint = {
  id: string;
  lngLat: [number, number];
  renderPopup: () => ReactNode;
};

export type RegisterMapPoint = (point: MapRegisteredPoint) => () => void;

type MapLibreContextValue = {
  map: maplibregl.Map | null;
  registerPoint: RegisterMapPoint;
};

const MapLibreContext = createContext<MapLibreContextValue | null>(null);

export function MapLibreProvider({
  map,
  registerPoint,
  children,
}: {
  map: maplibregl.Map | null;
  registerPoint: RegisterMapPoint;
  children: ReactNode;
}) {
  return (
    <MapLibreContext.Provider value={{ map, registerPoint }}>
      {children}
    </MapLibreContext.Provider>
  );
}

export function useMapLibreMap(): maplibregl.Map | null {
  const context = useContext(MapLibreContext);
  if (!context) {
    throw new Error("useMapLibreMap must be used with a context");
  }
  return context.map;
}

export function useRegisterMapPoint(): RegisterMapPoint {
  const context = useContext(MapLibreContext);
  if (!context) {
    throw new Error("useRegisterMapPoint must be used with a context");
  }
  return context.registerPoint;
}
