import Link from "next/link";
import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";
import type { NotificationApiRead } from "@/schemas/api/notification.schema";

export const NotificationItemLink = ({ item, onRead }: Props): ReactElement => {
  return (
    <Link
      href={item.href}
      onClick={() => onRead(item)}
      className="flex flex-col gap-1 p-4 bg-none text-sm hover:bg-contrast-grey"
    >
      <span className="flex justify-between gap-4">
        <span className={cn(item.isNew && "font-bold")}>
          {item.isNew && <span className="fr-sr-only">Nouveau : </span>}
          {item.label}
        </span>
        <time dateTime={item.occurredAt} className="shrink-0 text-mention-grey">
          {item.dateLabel}
        </time>
      </span>
      <span className="text-mention-grey">
        {item.structureCode} ({item.departement})
        {item.authorLevelLabel && ` · ${item.authorLevelLabel}`}
      </span>
    </Link>
  );
};

type Props = {
  item: NotificationApiRead;
  onRead: (item: NotificationApiRead) => void;
};
