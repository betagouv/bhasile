"use client";

import { useParams, usePathname } from "next/navigation";

import { Logo } from "@/app/components/Logo";
import { useFetchTransformation } from "@/app/hooks/useFetchTransformation";

import { TransformationMenuItem } from "./TransformationMenuItem";

export const TransformationMenu = () => {
  const pathname = usePathname();
  const { idTransformation } = useParams();

  console.log(Number(idTransformation));
  const { transformation } = useFetchTransformation(
    idTransformation ? Number(idTransformation) : undefined
  );

  return (
    <nav className="fr-sidemenu pe-0 h-screen sticky flex flex-col top-0 w-72 border-r border-default-grey shrink-0">
      <div className="border-b border-default-grey min-h-[4.35rem] grid">
        <Logo />
      </div>

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
        disabled={!idTransformation}
      />
      <TransformationMenuItem
        index={3}
        label="Verification"
        url={`/structures/transformation/${idTransformation}/verification`}
        isActive={pathname.includes("/verification")}
        disabled={!idTransformation}
      />
    </nav>
  );
};
