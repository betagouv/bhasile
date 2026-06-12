// import { headers } from "next/headers";
// import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { StatistiquesApiType } from "@/schemas/api/statistiques.schema";

import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { StatistiquesProvider } from "./_context/StatistiquesContext";

async function getStatistiques(): Promise<StatistiquesApiType> {
  await console.log("TEST");
  return {
    totalStructures: 42,
    totalCpoms: 12,
    totalPlaces: 106,
    structureTypes: [
      {
        label: "CADA",
        byYear: [
          { year: 2026, nbStructures: 12, nbPlaces: 56, nbCpoms: 11 },
          { year: 2025, nbStructures: 11, nbPlaces: 55, nbCpoms: 10 },
          { year: 2024, nbStructures: 10, nbPlaces: 54, nbCpoms: 9 },
        ],
      },
      {
        label: "HUDA",
        byYear: [
          { year: 2026, nbStructures: 5, nbPlaces: 32, nbCpoms: 7 },
          { year: 2025, nbStructures: 4, nbPlaces: 31, nbCpoms: 8 },
          { year: 2024, nbStructures: 3, nbPlaces: 30, nbCpoms: 6 },
        ],
      },
      {
        label: "CAES",
        byYear: [
          { year: 2026, nbStructures: 3, nbPlaces: 12, nbCpoms: 5 },
          { year: 2025, nbStructures: 2, nbPlaces: 11, nbCpoms: 4 },
          { year: 2024, nbStructures: 1, nbPlaces: 10, nbCpoms: 3 },
        ],
      },
      {
        label: "CPH",
        byYear: [
          { year: 2026, nbStructures: 2, nbPlaces: 6, nbCpoms: 2 },
          { year: 2025, nbStructures: 1, nbPlaces: 5, nbCpoms: 1 },
          { year: 2024, nbStructures: 0, nbPlaces: 4, nbCpoms: 0 },
        ],
      },
    ],
    structureBatis: [
      {
        label: "Diffus",
        byYear: [
          { year: 2026, nbStructures: 12, nbPlaces: 56, nbCpoms: 11 },
          { year: 2025, nbStructures: 11, nbPlaces: 55, nbCpoms: 10 },
          { year: 2024, nbStructures: 10, nbPlaces: 54, nbCpoms: 9 },
        ],
      },
      {
        label: "Collectif",
        byYear: [
          { year: 2026, nbStructures: 5, nbPlaces: 32, nbCpoms: 7 },
          { year: 2025, nbStructures: 4, nbPlaces: 31, nbCpoms: 8 },
          { year: 2024, nbStructures: 3, nbPlaces: 30, nbCpoms: 6 },
        ],
      },
      {
        label: "Mixte",
        byYear: [
          { year: 2026, nbStructures: 3, nbPlaces: 12, nbCpoms: 5 },
          { year: 2025, nbStructures: 2, nbPlaces: 11, nbCpoms: 4 },
          { year: 2024, nbStructures: 1, nbPlaces: 10, nbCpoms: 3 },
        ],
      },
    ],
  };
  // TODO : uncomment this when adding real API call
  // try {
  //   const baseUrl = process.env.NEXT_URL || "";
  //   const result = await fetch(`${baseUrl}/api/statistiques`, {
  //     cache: "no-store",
  //     // Requête côté serveur donc il faut appeler les headers manuellement
  //     headers: await headers(),
  //   });
  //   if (!result.ok) {
  //     throw new Error(
  //       `Impossible de récupérer les statistiques : ${result.status}`
  //     );
  //   }
  //   return await result.json();
  // } catch (error) {
  //   console.error(error);
  //   notFound();
  // }
}

export default async function StatistiquesLayout({
  children,
}: {
  children: ReactNode;
}) {
  const statistiques = await getStatistiques();

  return (
    <StatistiquesProvider statistiques={statistiques}>
      <div className="flex flex-col h-full bg-alt-grey gap-3 pb-4">
        <StatistiquesHeader />
        <div className="flex flex-col gap-3 px-3">{children}</div>
      </div>
    </StatistiquesProvider>
  );
}
