"use client";

import maplibregl from "maplibre-gl";
import { createContext, useContext } from "react";

// null tant que la carte n'a pas fini de charger son style.
export const MapContext = createContext<maplibregl.Map | null>(null);

export const useMap = (): maplibregl.Map | null => useContext(MapContext);
