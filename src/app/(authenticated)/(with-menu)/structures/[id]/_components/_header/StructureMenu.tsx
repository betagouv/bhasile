import Button from "@codegouvfr/react-dsfr/Button";
import Link from "next/link";

import { useButtonsPanel } from "@/app/hooks/useButtonsPanel";

export const StructureMenu = ({ structureId }: Props) => {
  const { isPanelOpen, setIsPanelOpen, panelRef } = useButtonsPanel();
  //TODO: remove this once transformation is ready
  if (process.env.NEXT_PUBLIC_SHOW_TRANSFORMATION !== "true") {
    return null;
  }

  return (
    <div className="relative" ref={panelRef}>
      <Button
        priority="tertiary no outline"
        iconId="ri-more-2-fill"
        title="Menu structure"
        onClick={() => {
          setIsPanelOpen(!isPanelOpen);
        }}
      />
      {isPanelOpen && (
        <div className="absolute top-full right-0 flex flex-col items-end bg-white shadow-md z-50">
          <Link
            href={`/structures/transformation/type?structureId=${structureId}`}
            className="whitespace-nowrap fr-btn fr-btn--tertiary-no-outline"
          >
            Extension, contraction ou fermeture
          </Link>
        </div>
      )}
    </div>
  );
};

type Props = {
  structureId: number;
};
