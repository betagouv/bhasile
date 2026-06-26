"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { cn } from "@/app/utils/classname.util";

type Statut = "actives" | "fermees";

const TABS: { value: Statut; label: string }[] = [
  { value: "actives", label: "Actives" },
  { value: "fermees", label: "Fermées" },
];

export const StatutTabs = (): ReactElement | null => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentStatut: Statut =
    searchParams.get("statut") === "fermees" ? "fermees" : "actives";

  const handleSelect = (statut: Statut) => {
    if (statut === currentStatut) {
      return;
    }
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set("statut", statut);
    params.delete("page");
    params.delete("column");
    params.delete("direction");
    router.push(`?${params.toString()}`);
  };

  //TODO: remove this once transformation is ready
  if (process.env.NEXT_PUBLIC_SHOW_TRANSFORMATION !== "true") {
    return null;
  }

  return (
    <div
      className={cn(
        "relative flex items-stretch flex-1",
        "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-0.5 before:border before:border-default-grey"
      )}
    >
      {TABS.map(({ value, label }) => {
        const isActive = value === currentStatut;
        return (
          <button
            key={value}
            type="button"
            aria-current={isActive || undefined}
            onClick={() => handleSelect(value)}
            className={cn(
              "relative flex items-center px-6 py-1 uppercase text-sm font-bold tracking-wide bg-transparent border-b-2 cursor-pointer",
              isActive
                ? "text-title-blue-france border-current"
                : "text-mention-grey border-transparent"
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
