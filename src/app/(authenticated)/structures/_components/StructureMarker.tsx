import { ReactElement, useEffect, useMemo } from "react";

import { useRegisterMapPoint } from "../../../components/map/MapLibreContext";
import { StructureMarkerContent } from "./StructureMarkerContent";

export const StructureMarker = ({ id, coordinates }: Props): ReactElement => {
  const registerPoint = useRegisterMapPoint();

  const isValid = useMemo(() => {
    const [lat, lng] = coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return false;
    }
    // Skip “0,0” placeholders
    if (lat === 0 && lng === 0) {
      return false;
    }
    return true;
  }, [coordinates]);

  const lngLat = useMemo<[number, number]>(() => {
    const [lat, lng] = coordinates;
    return [lng, lat];
  }, [coordinates]);

  useEffect(() => {
    if (!isValid) {
      return;
    }
    return registerPoint({
      id: String(id),
      lngLat,
      renderPopup: () => <StructureMarkerContent id={id} />,
    });
  }, [id, isValid, lngLat, registerPoint]);

  return <></>;
};

type Props = {
  id: number;
  coordinates: [number, number]; // (lat, lng)
};
