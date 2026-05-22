import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { ReactElement } from "react";

import { StructureType } from "@/generated/prisma/enums";
import { ActiviteApiType } from "@/schemas/api/activite.schema";

import { useStructureContext } from "../../_context/StructureClientContext";

export const ActiviteTypes = ({
  typeActivite,
  setTypeActivite,
}: Props): ReactElement => {
  const { structure } = useStructureContext();
  const tags: ActiviteTag[] = [
    {
      label: "Indisponibles",
      value: "placesIndisponibles",
      isDisplayed: true,
    },
    {
      label: "Présences indues BPI",
      value: "presencesInduesBPI",
      isDisplayed: structure.type !== StructureType.CPH,
    },
    {
      label: "Présences indues déboutées",
      value: "presencesInduesDeboutees",
      isDisplayed: structure.type !== StructureType.CPH,
    },
    {
      label: "Présences indues totales",
      value: "presencesIndues",
      isDisplayed: structure.type !== StructureType.CPH,
    },
  ];

  return (
    <>
      {tags
        .filter((tag) => tag.isDisplayed)
        .map((tag, index) => (
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
  isDisplayed: boolean;
};
