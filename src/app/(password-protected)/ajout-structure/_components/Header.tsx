"use client";

import { useParams, useSearchParams } from "next/navigation";

import { Logo } from "@/app/components/Logo";

import { StructureName } from "./StructureName";

export const Header = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id || searchParams.get("id");

  return (
    <header className="bg-white shadow-md">
      <div className="fr-container flex py-4 gap-4 items-center">
        <div className="fr-header__logo order-none p-0">
          <p className="fr-logo">
            République
            <br />
            française
          </p>
        </div>
        <Logo />
        <div className="inline-block min-h-[1em] w-0.5 self-stretch bg-alt-raised-grey" />
        <p className="flex flex-col uppercase gap-1 text-action-high-blue-france m-0">
          <span className="text-xs leading-none font-bold">
            Ajouter une structure
          </span>

          {id ? (
            <span className="text-xl leading-none">
              <StructureName id={id} />
            </span>
          ) : (
            ""
          )}
        </p>
      </div>
    </header>
  );
};
