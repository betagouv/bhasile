"use client";

import maplibregl from "maplibre-gl";
import { createRoot,Root } from "react-dom/client";

export function getOrCreatePopup({
  popupRef,
  popupRootRef,
}: {
  popupRef: React.RefObject<maplibregl.Popup | null>;
  popupRootRef: React.RefObject<Root | null>;
}): { popup: maplibregl.Popup; root: Root } {
  if (!popupRef.current) {
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: true,
      maxWidth: "none",
    });
  }

  if (!popupRootRef.current) {
    const popupContainer = document.createElement("div");
    popupContainer.className = "bhasile-map-popup";
    popupRootRef.current = createRoot(popupContainer);
    popupRef.current.setDOMContent(popupContainer);
  }

  return { popup: popupRef.current, root: popupRootRef.current };
}
