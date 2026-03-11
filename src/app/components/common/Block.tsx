import Button from "@codegouvfr/react-dsfr/Button";
import { PropsWithChildren, ReactElement } from "react";

export const Block = ({
  title,
  iconClass,
  onEdit,
  multipleEdit,
  children,
}: Props): ReactElement => {
  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className={`text-title-blue-france mr-3 ${iconClass}`} />
          <h3 className="text-title-blue-france fr-h6 mb-12">{title}</h3>
        </div>
        {onEdit && (
          <Button
            priority="tertiary"
            iconId="fr-icon-edit-line"
            onClick={onEdit}
          >
            Modifier
          </Button>
        )}
        {multipleEdit && (
          <div className="flex">
            {multipleEdit.map((edit) => (
              <Button
                key={edit.label.toString()}
                priority="tertiary"
                iconId="fr-icon-edit-line"
                onClick={edit.onClick}
              >
                {edit.label}
              </Button>
            ))}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};

type Props = PropsWithChildren<{
  title: string;
  iconClass: string;
  onEdit?: () => void;
  multipleEdit?: {
    label: ReactElement;
    onClick: () => void;
  }[];
}>;
