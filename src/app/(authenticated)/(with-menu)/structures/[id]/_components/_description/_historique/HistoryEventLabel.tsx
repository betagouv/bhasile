import Link from "next/link";
import { useSession } from "next-auth/react";
import { ReactElement } from "react";

import { canAccessPage } from "@/lib/casl/pages";
import { SessionUser } from "@/types/global";
import { HistoryEvent, HistoryEventKind } from "@/types/structure-history.type";

import { StructureRefLinks } from "./StructureRefLinks";

type Props = {
  event: HistoryEvent;
};

type EventKind = Exclude<HistoryEventKind, "CPOM_ENTRY" | "CPOM_EXIT">;

const eventConfig: Record<
  EventKind,
  { title: string; singular: string; plural: string }
> = {
  CREATION: {
    title: "Création de la structure",
    singular: " à partir de la structure ",
    plural: " à partir des structures ",
  },
  EXTENSION: {
    title: "Extension de places",
    singular: " issues de la structure ",
    plural: " issues des structures ",
  },
  CONTRACTION: {
    title: "Contraction de places",
    singular: " transférées vers la structure ",
    plural: " transférées vers les structures ",
  },
  FERMETURE: {
    title: "Fermeture de la structure",
    singular: ", places transférées vers la structure ",
    plural: ", places transférées vers les structures ",
  },
};

export const HistoryEventLabel = ({ event }: Props): ReactElement => {
  const { data } = useSession();

  if (event.kind === "CPOM_ENTRY" || event.kind === "CPOM_EXIT") {
    const cpomLabel = `${event.cpom.operateurName} ${
      event.cpom.regionName ?? event.cpom.departements.join(", ")
    }`;
    return (
      <span>
        <strong>
          {event.kind === "CPOM_ENTRY"
            ? "Entrée dans le CPOM"
            : "Sortie du CPOM"}
        </strong>{" "}
        {canAccessPage(data?.user as SessionUser, "/cpoms") ? (
          <Link href={`/cpoms/${event.cpom.id}`}>{cpomLabel}</Link>
        ) : (
          cpomLabel
        )}
      </span>
    );
  }

  const config = eventConfig[event.kind];
  const refs =
    event.kind === "CONTRACTION" || event.kind === "FERMETURE"
      ? event.targets
      : event.sources;

  const content = (
    <>
      <strong>{config.title}</strong>
      {refs.length > 0 && (
        <>
          {refs.length === 1 ? config.singular : config.plural}
          <StructureRefLinks refs={refs} />
        </>
      )}
    </>
  );

  if (event.kind === "FERMETURE") {
    return (
      <span className="flex flex-col">
        <span>{content}</span>
        {event.motif && (
          <span className="fr-text--sm italic">Motif : {event.motif}</span>
        )}
      </span>
    );
  }

  return <span>{content}</span>;
};
