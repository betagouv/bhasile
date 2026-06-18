import Link from "next/link";
import { ReactElement } from "react";

import { HistoryEvent } from "@/types/structure-history.type";

import { StructureRefLinks } from "./StructureRefLinks";

type Props = {
  event: HistoryEvent;
};

export const HistoryEventLabel = ({ event }: Props): ReactElement => {
  switch (event.kind) {
    case "CREATION":
      return (
        <span>
          <strong>Création de la structure</strong>
          {event.sources.length > 0 && (
            <>
              {event.sources.length === 1
                ? " à partir de la structure "
                : " à partir des structures "}
              <StructureRefLinks refs={event.sources} />
            </>
          )}
        </span>
      );
    case "EXTENSION":
      return (
        <span>
          <strong>Extension de places</strong>
          {event.sources.length > 0 && (
            <>
              {event.sources.length === 1
                ? " issues de la structure "
                : " issues des structures "}
              <StructureRefLinks refs={event.sources} />
            </>
          )}
        </span>
      );
    case "CONTRACTION":
      return (
        <span>
          <strong>Contraction de places</strong>
          {event.targets.length > 0 && (
            <>
              {event.targets.length === 1
                ? " transférées vers la structure "
                : " transférées vers les structures "}
              <StructureRefLinks refs={event.targets} />
            </>
          )}
        </span>
      );
    case "FERMETURE":
      return (
        <span className="flex flex-col">
          <span>
            <strong>Fermeture de la structure</strong>
            {event.targets.length > 0 && (
              <>
                {event.targets.length === 1
                  ? ", places transférées vers la structure "
                  : ", places transférées vers les structures "}
                <StructureRefLinks refs={event.targets} />
              </>
            )}
          </span>
          {event.motif && (
            <span className="fr-text--sm italic">Motif : {event.motif}</span>
          )}
        </span>
      );
    case "CPOM_ENTRY":
    case "CPOM_EXIT":
      return (
        <span>
          <strong>
            {event.kind === "CPOM_ENTRY"
              ? "Entrée dans le CPOM"
              : "Sortie du CPOM"}
          </strong>{" "}
          <Link href={`/cpoms/${event.cpom.id}`}>
            {event.cpom.operateurName} {event.cpom.departements.join(", ")}
          </Link>
        </span>
      );
  }
};
