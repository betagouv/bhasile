import Button from "@codegouvfr/react-dsfr/Button";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { useEffect, useRef, useState } from "react";

import { Departement } from "@/types/departement.type";

export const DepartementsSelector = ({
  departements,
  selectedDepartements,
  handleDepartementToggle,
}: Props) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);

  const handleTogglePanel = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsOpen((prevIsOpen) => !prevIsOpen);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

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
          className="relative bg-contrast-grey text-black font-normal border-b-2 border-b-black w-full rounded-t-md h-10"
          aria-labelledby="departementsSelector-label"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          {selectedDepartements.length > 0
            ? selectedDepartements.join(", ")
            : "Sélectionner des départements"}
          <span className="absolute right-2 top-1/2 -translate-y-1/2 fr-icon-arrow-down-s-line fr-icon--sm" />
        </Button>
        {isOpen && (
          <div
            ref={panelRef}
            className="absolute top-full right-0 left-0 mt-0 w-96  bg-white rounded-md shadow-md z-50"
          >
            <div className="max-h-[40.5rem] overflow-y-scroll overflow-x-hidden py-4 flex flex-col px-4">
              {departements.map((departement) => (
                <Checkbox
                  key={departement.numero}
                  options={[
                    {
                      label: `${departement.name} - ${departement.numero}`,
                      nativeInputProps: {
                        name: "structure-departement",
                        value: departement.numero,
                        checked: selectedDepartements.includes(
                          departement.numero
                        ),
                        onChange: () =>
                          handleDepartementToggle(departement.numero),
                      },
                    },
                  ]}
                  className={
                    "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 mb-1"
                  }
                  small
                />
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
  selectedDepartements: string[];
  handleDepartementToggle: (value: string) => void;
};
