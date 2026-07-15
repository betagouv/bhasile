"use client";

import { Select } from "@codegouvfr/react-dsfr/Select";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useTransition } from "react";

import {
  RAPPEL_ECHELLE_OPTIONS,
  RAPPEL_GROUP_BY_OPTIONS,
  resolveRappelGroupBy,
} from "@/app/utils/rappel.util";
import { RappelEchelle, RappelGroupBy } from "@/types/dashboard.type";

type Props = {
  echelle: RappelEchelle;
  groupBy: RappelGroupBy;
};

export const RappelsControls = ({ echelle, groupBy }: Props): ReactElement => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParams = (updates: Record<string, string>): void => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        params.set(key, value);
      }
      params.set("rappelsPage", "0");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    });
  };

  const handleEchelleChange = (nextEchelle: RappelEchelle): void => {
    updateParams({
      rappelsEchelle: nextEchelle,
      rappelsGroupe: resolveRappelGroupBy(nextEchelle, groupBy),
    });
  };

  return (
    <div
      className={`flex items-end gap-4 ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
    >
      <Select
        label="Échelle"
        nativeSelectProps={{
          value: echelle,
          onChange: (event) =>
            handleEchelleChange(event.target.value as RappelEchelle),
        }}
        className="mb-0 flex items-center gap-2 [&_select]:mt-0 [&_label]:whitespace-nowrap"
      >
        {RAPPEL_ECHELLE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>

      <Select
        label="Groupé par"
        nativeSelectProps={{
          value: groupBy,
          onChange: (event) =>
            updateParams({ rappelsGroupe: event.target.value }),
        }}
        className="mb-0 flex items-center gap-2 [&_select]:mt-0 [&_label]:whitespace-nowrap"
      >
        {RAPPEL_GROUP_BY_OPTIONS[echelle].map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
};
