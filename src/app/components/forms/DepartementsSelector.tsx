import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
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
        <label htmlFor="departementsSelector" className="block mb-2">
          Départements
        </label>
        <Button
          onClick={handleTogglePanel}
          disabled={departements.length === 0}
          className="bg-contrast-grey text-black font-normal border-b-2 border-b-black w-full"
        >
          DepartementsSelector
        </Button>
        {isOpen && (
          <div
            ref={panelRef}
            className="absolute top-full right-0 left-0 mt-0 w-96  bg-white rounded-md shadow-md z-50"
          >
            <div className="max-h-[40.5rem] overflow-y-scroll overflow-x-hidden py-4 flex flex-col ">
              {departements.map((departement) => (
                <Checkbox
                key={departement.numero}
                options={[
                  {
                    label: `${departement.name} - ${departement.numero}`,
                    nativeInputProps: {
                      name: "structure-departement",
                      value: departement.numero,
                      checked: departements.includes(departement.numero),
                      onChange: handleDepartementToggle,
                    },
                  },
                ]}
                className={
                  "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 mb-1"
                }
                small
              />
                  {departement.name}
                </Checkbox>
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
