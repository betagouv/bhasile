"use client";

import { useParams, usePathname } from "next/navigation";

import { Logo } from "@/app/components/Logo";

import { TransformationMenuItem } from "./TransformationMenuItem";
import { TransformationSteps } from "./TransformationSteps";

export const TransformationMenu = () => {
  const pathname = usePathname();
  const { idTransformation } = useParams();

  return (
    <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey bg-alt-blue-france shrink-0">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>
      <div className="flex flex-col gap-8 py-8">
        <TransformationMenuItem
          index={1}
          label="Cas de figure"
          url={
            idTransformation
              ? `/structures/transformation/${idTransformation}/type`
              : "/structures/transformation/type"
          }
          isActive={pathname.includes("/type")}
        />
        <TransformationMenuItem
          index={2}
          label="Saisie des données"
          isActive={
            pathname.includes("/contraction") ||
            pathname.includes("/extension") ||
            pathname.includes("/ouverture") ||
            pathname.includes("/fermeture")
          }
          disabled={true}
        >
          <TransformationSteps
            idTransformation={Number(idTransformation) ?? undefined}
          />
        </TransformationMenuItem>
        <TransformationMenuItem
          index={3}
          label="Verification"
          url={`/structures/transformation/${idTransformation}/verification`}
          isActive={pathname.includes("/verification")}
          disabled={!idTransformation}
        />
      </div>
    </nav>
  );
};
