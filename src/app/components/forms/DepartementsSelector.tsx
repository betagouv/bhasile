import Button from "@codegouvfr/react-dsfr/Button";
import { useEffect, useRef, useState } from "react";

import { Departement } from "@/types/departement.type";

export const DepartementsSelector = ({ departements }: Props) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const handleTogglePanel = () => {
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      let clickedInsidePanel = false;

      if (panelRef.current && panelRef.current.contains(event.target as Node)) {
        clickedInsidePanel = true;
      }

      if (!clickedInsidePanel) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative">
      <div className="relative">
        <Button onClick={handleTogglePanel}>DepartementsSelector</Button>
        {isOpen && (
          <div
            ref={panelRef}
            className="absolute top-full right-0 mt-1 w-96  bg-red-500 rounded-md shadow-md z-50"
          >
            <div className="max-h-[40.5rem] overflow-y-scroll overflow-x-hidden py-4">
              {departements.map((departement) => (
                <div key={departement.numero}>{departement.name}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

type Props = {
  departements: Departement[];
};
