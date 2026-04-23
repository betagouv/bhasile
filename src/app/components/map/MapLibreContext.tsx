 "use client";
 
 import maplibregl from "maplibre-gl";
 import { createContext, ReactNode, useContext } from "react";
 
 export type MapRegisteredPoint = {
   id: string;
   lngLat: [number, number]; // [lng, lat]
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
   const ctx = useContext(MapLibreContext);
   if (!ctx) {
     throw new Error("useMapLibreMap must be used within a MapLibreProvider");
   }
   return ctx.map;
 }
 
 export function useRegisterMapPoint(): RegisterMapPoint {
   const ctx = useContext(MapLibreContext);
   if (!ctx) {
     throw new Error("useRegisterMapPoint must be used within a MapLibreProvider");
   }
   return ctx.registerPoint;
 }
 
