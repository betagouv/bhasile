import Button from "@codegouvfr/react-dsfr/Button";
import {
  PropsWithChildren,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";

export const Block = ({
  title,
  iconClass,
  onEdit,
  multipleEdit,
  children,
}: Props): ReactElement => {
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
                {multipleEdit.map((edit) => (
                  <Button
                    key={edit.label.toString()}
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
