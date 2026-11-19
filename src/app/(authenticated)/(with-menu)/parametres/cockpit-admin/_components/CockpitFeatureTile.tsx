import Link from "next/link";
import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { cn } from "@/app/utils/classname.util";
import { CockpitFeature } from "@/types/cockpit-admin.type";

export const CockpitFeatureTile = ({ feature }: Props): ReactElement => {
  const content = (
    <>
      <span
        className={cn(
          feature.icon,
          feature.isEnabled ? "text-title-blue-france" : "text-disabled-grey"
        )}
        aria-hidden="true"
      />
      <h4
        className={cn(
          "text-lg mb-0",
          feature.isEnabled ? "text-title-blue-france" : "text-disabled-grey"
        )}
      >
        {feature.title}
      </h4>
      <p className="text-sm text-mention-grey mb-0">{feature.description}</p>
      {!feature.isEnabled && (
        <Badge type="disabled" className="mt-auto">
          Bientôt disponible
        </Badge>
      )}
    </>
  );

  const className =
    "flex flex-col gap-2 h-full p-6 border border-default-grey rounded-[10px] bg-white bg-none";

  if (!feature.isEnabled) {
    return (
      <div className={cn(className, "bg-alt-grey")} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link
      href={feature.href}
      className={cn(className, "hover:bg-default-grey-hover")}
    >
      {content}
    </Link>
  );
};

type Props = {
  feature: CockpitFeature;
};
