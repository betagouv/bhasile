import { Accordion } from "@codegouvfr/react-dsfr/Accordion";
import Checkbox from "@codegouvfr/react-dsfr/Checkbox";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef } from "react";

import { cn } from "@/app/utils/classname.util";
import { DEPARTEMENTS } from "@/constants";

const REGIONS_WITH_ONE_DEPARTEMENT = [
  "Guadeloupe",
  "Martinique",
  "Guyane",
  "La Réunion",
  "Mayotte",
];

export const FiltersRegion = ({
  region,
  departements,
  setDepartements,
  children,
}: Props) => {
  const checkedStatus = useMemo(() => {
    const numOfDepartementsInRegion = DEPARTEMENTS.filter(
      (departement) => departement.region === region
    ).length;
    const numOfDepartementsChecked = departements.filter((departement) =>
      DEPARTEMENTS.some((d) => d.numero === departement && d.region === region)
    ).length;

    if (numOfDepartementsChecked === numOfDepartementsInRegion) {
      return "checked";
    }
    if (numOfDepartementsChecked > 0) {
      return "incomplete";
    }
    return "unchecked";
  }, [departements, region]);

  const checkboxWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrapper = checkboxWrapperRef.current;
    if (!wrapper) {
      return;
    }

    const handleClick = (e: MouseEvent) => {
      // We need to stop the propagation of the native event
      // to avoid opening the accordion when clicking on the checkbox
      e.stopPropagation();
      e.stopImmediatePropagation();

      const target = e.target as HTMLElement;
      if (target.tagName !== "LABEL") {
        return;
      }

      if (checkedStatus === "checked") {
        setDepartements((prevDepartements) =>
          prevDepartements.filter(
            (departement) =>
              !DEPARTEMENTS.some(
                (d) => d.numero === departement && d.region === region
              )
          )
        );
      } else {
        setDepartements((prevDepartements) => {
          const newDepartements = [
            ...prevDepartements,
            ...DEPARTEMENTS.filter(
              (departement) => departement.region === region
            ).map((departement) => departement.numero),
          ];
          return [...new Set(newDepartements)];
        });
      }
    };

    wrapper.addEventListener("click", handleClick, true);

    return () => {
      wrapper.removeEventListener("click", handleClick, true);
    };
  }, [checkedStatus, setDepartements, region]);

  const isRegionWithOneDepartement = useMemo(() => {
    return REGIONS_WITH_ONE_DEPARTEMENT.includes(region);
  }, [region]);

  return (
    <Accordion
      className={cn(
        "[&:before]:content-none",
        "[&>h3>button]:py-1.5 [&>h3>button]:px-6 [&>h3>button]:min-h-0 [&>h3>button]:bg-transparent!",
        "[&>div]:py-0 [&>div]:px-6",
        isRegionWithOneDepartement && "[&>h3>button:after]:content-none"
      )}
      label={
        <div ref={checkboxWrapperRef}>
          <Checkbox
            options={[
              {
                label: region,
                nativeInputProps: {
                  name: "structure-region",
                  value: region,
                  checked: checkedStatus !== "unchecked",
                  onChange: (e) => {
                    console.log(e.target.value); // It is never fired because of the stopPropagation
                  },
                },
              },
            ]}
            className={cn(
              "[&_label]:text-sm [&_label]:leading-6 [&_label]:pb-0 [&_label]:text-title-blue-france",
              checkedStatus === "incomplete" &&
                "[&>label:before]:bg-none [&:before]:content-[''] [&:before]:absolute [&:before]:z-10 [&:before]:top-1/2 [&:before]:-translate-y-1/2 [&:before]:left-1 [&:before]:w-2 [&:before]:h-[1px] [&:before]:bg-white"
            )}
            small
          />
        </div>
      }
    >
      <div className="ml-3">{!isRegionWithOneDepartement && children}</div>
    </Accordion>
  );
};

type Props = {
  region: string;
  departements: string[];
  setDepartements: Dispatch<SetStateAction<string[]>>;
  children: React.ReactElement;
};
