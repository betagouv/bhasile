import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { ReactElement } from "react";

import { ActiviteApiType } from "@/schemas/api/activite.schema";

export const ActiviteTypes = ({
  typeActivite,
  setTypeActivite,
}: Props): ReactElement => {
  const tags: ActiviteTag[] = [
    {
      label: "Présences indues BPI",
      value: "presencesInduesBPI",
    },
    {
      label: "Présences indues déboutées",
      value: "presencesInduesDeboutees",
    },
    {
      label: "Présences indues totales",
      value: "presencesIndues",
    },
    {
      label: "Vacantes",
      value: "placesVacantes",
    },
    {
      label: "Indisponibles",
      value: "placesIndisponibles",
    },
    {
      label: "Total",
      value: "placesAutorisees",
    },
  ];

  return (
    <>
      {tags.map((tag, index) => (
        <div key={`tag-${index}`} className="pr-2">
          <Tag
            nativeButtonProps={{
              onClick: (event) => {
                if (tag.value === typeActivite) {
                  event.preventDefault();
                  return;
                }
                setTypeActivite(tag.value);
              },
              style:
                tag.value === typeActivite
                  ? {
                      pointerEvents: "none",
                      cursor: "default",
                    }
                  : {},
            }}
            pressed={tag.value === typeActivite}
          >
            {tag.label}
          </Tag>
        </div>
      ))}
    </>
  );
};

type Props = {
  typeActivite: keyof ActiviteApiType;
  setTypeActivite: (typeActivite: keyof ActiviteApiType) => void;
};

type ActiviteTag = {
  label: string;
  value: keyof ActiviteApiType;
};
