import { subject } from "@casl/ability";
import { Can } from "@casl/react";
import Button from "@codegouvfr/react-dsfr/Button";
import { PropsWithChildren, ReactElement, useContext } from "react";

import { useStructureContext } from "@/app/(authenticated)/structures/[id]/_context/StructureClientContext";
import { AbilityContext } from "@/app/context/AbilityContext";
import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";

export const Block = ({
  title,
  iconClass,
  onEdit,
  multipleEdit,
  children,
}: Props): ReactElement => {
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  const ability = useContext(AbilityContext);
  const { structure } = useStructureContext();

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className={`text-title-blue-france mr-3 ${iconClass}`} />
          <h3 className="text-title-blue-france fr-h6 mb-12">{title}</h3>
        </div>
        <Can
          I="update"
          this={subject("Structure", structure)}
          ability={ability}
        >
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
            <div className="relative" ref={panelRef}>
              <Button
                priority="tertiary"
                iconId="fr-icon-edit-line"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
              >
                Modifier
              </Button>
              {isPanelOpen && (
                <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
                  {multipleEdit.map((edit, index) => (
                    <Button
                      key={index}
                      priority="tertiary no outline"
                      onClick={edit.onClick}
                      className="whitespace-nowrap"
                    >
                      {edit.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Can>
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
