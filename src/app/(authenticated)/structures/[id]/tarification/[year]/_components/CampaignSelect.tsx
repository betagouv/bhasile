"use client";

import Select from "@codegouvfr/react-dsfr/Select";
import { useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent, ReactElement } from "react";

export const CampaignSelect = ({
  structureId,
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
    <Select
      label={<span className="sr-only">Campagne</span>}
      className="mb-0"
      nativeSelectProps={{
        name: "campagne",
        value: String(year),
        onChange: handleYearChange,
      }}
    >
      {campaignYears.map((campaignYear) => (
        <option key={campaignYear} value={campaignYear}>
          Campagne {campaignYear}
        </option>
      ))}
    </Select>
  );
};

type Props = {
  structureId: number;
  year: number;
  campaignYears: number[];
};
