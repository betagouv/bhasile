import { Tag } from "@codegouvfr/react-dsfr/Tag";
import { ReactElement } from "react";

import { ActiviteApiType } from "@/schemas/api/activite.schema";

import { TypeActiviteKey } from "./activite.constants";

export const ActiviteTypes = ({
  typeActivite,
  setTypeActivite,
  isCphStructure,
}: Props): ReactElement => {
  const tags: ActiviteTag[] = [
    {
      label: "Indisponibles",
      value: "placesIndisponibles",
      isDisplayed: true,
    },
    {
      label: "Présences indues BPI",
      value: "presencesInduesBPI",
      isDisplayed: !isCphStructure,
    },
    {
      label: "Présences indues déboutées",
      value: "presencesInduesDeboutees",
      isDisplayed: !isCphStructure,
    },
    {
      label: "Présences indues totales",
      value: "presencesInduesTotal",
      isDisplayed: !isCphStructure,
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
                  setTypeActivite(tag.value as TypeActiviteKey);
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
  typeActivite: TypeActiviteKey;
  setTypeActivite: (typeActivite: TypeActiviteKey) => void;
  isCphStructure: boolean;
};

type ActiviteTag = {
  label: string;
  value: keyof ActiviteApiType;
  isDisplayed: boolean;
};
