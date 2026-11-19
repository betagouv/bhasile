import { ReactElement } from "react";

import type { NotificationApiRead } from "@/schemas/api/notification.schema";

import { NotificationItemLink } from "./NotificationItemLink";

export const NotificationPanel = ({
  id,
  items,
  hasLoadingError,
  onRead,
}: Props): ReactElement => {
  return (
    <div
      id={id}
      className="absolute top-full right-0 z-50 w-[28rem] max-w-[90vw] max-h-[70vh] overflow-y-auto overscroll-contain bg-white shadow-md"
    >
      {hasLoadingError && (
        <p role="alert" className="m-0 p-4 text-sm text-default-error">
          Les notifications n’ont pas pu être chargées. Réessayez dans quelques
          instants.
        </p>
      )}
      {!hasLoadingError && items === null && (
        <p className="m-0 p-4 text-sm text-mention-grey">Chargement…</p>
      )}
      {items?.length === 0 && (
        <p className="m-0 p-4 text-sm text-mention-grey">
          Aucune notification.
        </p>
      )}
      {items && items.length > 0 && (
        <ul className="fr-raw-list m-0 p-1">
          {items.map((item) => (
            <li
              key={item.key}
              className="border-b border-b-border-default-grey last:border-b-0"
            >
              <NotificationItemLink item={item} onRead={onRead} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type Props = {
  id: string;
  items: NotificationApiRead[] | null;
  hasLoadingError: boolean;
  onRead: (item: NotificationApiRead) => void;
};
