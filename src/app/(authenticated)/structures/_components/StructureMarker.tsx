import { LatLngTuple } from "leaflet";
import { ReactElement, useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet/hooks";
import { Marker } from "react-leaflet/Marker";
import { Popup } from "react-leaflet/Popup";

import { singleMarkerIcon } from "../../../components/map/SingleMarker";
import { StructureMarkerContent } from "./StructureMarkerContent";

export const StructureMarker = ({ id, coordinates }: Props): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<L.Popup | null>(null);
  const map = useMap();

  useEffect(() => {
    const handlePopupOpen = (e: L.PopupEvent) => {
      if (e.popup === popupRef.current) {
        setIsOpen(true);
      }
    };

    map.on("popupopen", handlePopupOpen);
    return () => {
      map.off("popupopen", handlePopupOpen);
    };
  }, [map]);

  return (
    <Marker position={coordinates} icon={singleMarkerIcon}>
      <Popup
        ref={popupRef}
        className="[&>div]:rounded-none! [&>div>div]:m-6!"
        closeButton={false}
      >
        {isOpen && <StructureMarkerContent id={id} />}
        <div className="w-xl!" />
      </Popup>
    </Marker>
  );
};

type Props = {
  id: number;
  coordinates: LatLngTuple;
};
