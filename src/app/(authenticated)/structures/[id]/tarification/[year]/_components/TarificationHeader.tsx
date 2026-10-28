"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, ReactElement } from "react";

export const TarificationHeader = ({
  structureId,
  codeBhasile,
  year,
  campaignYears,
}: Props): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const query = searchParams.toString();
    router.push(
      `/structures/${structureId}/tarification/${event.target.value}${query ? `?${query}` : ""}`
    );
  };

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-b-border-default-grey">
      <div className="flex items-center gap-2 px-6 py-3">
        <Link
          href={`/structures/${structureId}`}
          className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-left-s-line"
          title="Retour"
        >
          Retour
        </Link>
        <div>
          <p className="text-title-blue-france text-xs uppercase font-bold mb-0">
            Tarification
          </p>
          <p className="text-title-blue-france font-bold fr-h6 mb-0">
            {codeBhasile}
          </p>
        </div>
        <div className="grow" />
        <Select
          label="Campagne"
          className="mb-0"
          nativeSelectProps={{
            name: "campagne",
            value: String(year),
            onChange: handleYearChange,
          }}
        >
          {campaignYears.map((campaignYear) => (
            <option key={campaignYear} value={campaignYear}>
              {campaignYear}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
};

type Props = {
  structureId: number;
  codeBhasile: string;
  year: number;
  campaignYears: number[];
};
