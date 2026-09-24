"use client";

import maplibregl from "maplibre-gl";
import { createRoot, Root } from "react-dom/client";

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
      // We manage closing ourselves, otherwise clicking another marker
      // may close the current popup without opening the next one.
      closeOnClick: false,
      maxWidth: "none",
    });
  }

  if (!popupRootRef.current) {
    const popupContainer = document.createElement("div");
    popupContainer.className = "p-0! rounded-none!";
    popupRootRef.current = createRoot(popupContainer);
    popupRef.current.setDOMContent(popupContainer);
  }

  return { popup: popupRef.current, root: popupRootRef.current };
}
