import { useEffect, useRef, useState } from "react";

export const useButtonsPanel = () => {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsidePanel = false;

      if (panelRef.current && panelRef.current.contains(event.target as Node)) {
        clickedInsidePanel = true;
      }

      if (!clickedInsidePanel) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return { isPanelOpen, setIsPanelOpen, panelRef };
};
