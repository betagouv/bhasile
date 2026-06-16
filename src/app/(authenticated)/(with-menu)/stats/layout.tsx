// import { headers } from "next/headers";
// import { notFound } from "next/navigation";
import { ReactNode } from "react";

import { StatistiquesApiType } from "@/schemas/api/statistiques.schema";

import { StatistiquesHeader } from "./_components/StatistiquesHeader";
import { StatistiquesProvider } from "./_context/StatistiquesContext";

async function getStatistiques(): Promise<StatistiquesApiType> {
  await (() => {});
  return {
    totalStructures: 42,
    totalCpoms: 12,
    totalPlaces: 106,
    tauxEquipement: 4,
    structuresAvecCpom: 23,
    dotationAnnuelle: 18000000,
    dotationAutorisees: 10000000,
    dotationSubventionnees: 8000000,
    ETP: 1600,
    ETPAutorisees: 900,
    ETPSubventionnees: 700,
    tauxEncadrement: 3.3,
    tauxEncadrementAutorisees: 2.7,
    tauxEncadrementSubventionnees: 4.1,
    coutJournalier: 18.4,
    coutJournalierAutorisees: 16.1,
    coutJournalierSubventionnees: 19.8,
    budgets: [
      {
        year: 2026,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -120000,
        deficitCumule: 140000,
        soldeCumule: -5000,
      },
      {
        year: 2025,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -120000,
        deficitCumule: 140000,
        soldeCumule: -5000,
      },
      {
        year: 2024,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -90000,
        deficitCumule: 160000,
        soldeCumule: -55000,
      },
      {
        year: 2023,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -180000,
        deficitCumule: 130000,
        soldeCumule: -45000,
      },
      {
        year: 2022,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -30000,
        deficitCumule: 80000,
        soldeCumule: 45000,
      },
      {
        year: 2021,
        dotationAccordee: 10,
        dotationDemandee: 20,
        totalProduits: 15,
        totalCharges: 13,
        excedentCumule: -130000,
        deficitCumule: 200000,
        soldeCumule: -90000,
      },
    ],
    placesAutorisees: 57,
    placesPmr: 4,
    placesLgbt: 5,
    placesFvvTeh: 6,
    placesQPV: 7,
    placesLogementsSociaux: 8,
    typesPlaces: [
      {
        label: "Places autorisées",
        byYear: [
          { year: 2026, nbPlaces: 32000 },
          { year: 2025, nbPlaces: 31000 },
          { year: 2024, nbPlaces: 30000 },
        ],
      },
      {
        label: "Taux d'équipement",
        byYear: [
          { year: 2026, nbPlaces: 4 },
          { year: 2025, nbPlaces: 3 },
          { year: 2024, nbPlaces: 2 },
        ],
      },
      {
        label: "Places PMR",
        byYear: [
          { year: 2026, nbPlaces: 520 },
          { year: 2025, nbPlaces: 510 },
          { year: 2024, nbPlaces: 500 },
        ],
      },
      {
        label: "Places LGBT",
        subLabel: "(spécialisées)",
        byYear: [
          { year: 2026, nbPlaces: 1000 },
          { year: 2025, nbPlaces: 900 },
          { year: 2024, nbPlaces: 800 },
        ],
      },
      {
        label: "Places FVV-TEH",
        subLabel: "(labellisées)",
        byYear: [
          { year: 2026, nbPlaces: 400 },
          { year: 2025, nbPlaces: 300 },
          { year: 2024, nbPlaces: 200 },
        ],
      },
      {
        label: "Places QPV",
        byYear: [
          { year: 2026, nbPlaces: 2000 },
          { year: 2025, nbPlaces: 1800 },
          { year: 2024, nbPlaces: 1700 },
        ],
      },
      {
        label: "Places en logements sociaux",
        byYear: [
          { year: 2026, nbPlaces: 1500 },
          { year: 2025, nbPlaces: 1450 },
          { year: 2024, nbPlaces: 1400 },
        ],
      },
    ],
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
    finance: {
      aggregation: "moyenne",
      byYear: [
        {
          year: 2024,
          total: {
            dotationDemandee: 12787043,
            dotationAccordee: 12126556,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 12555750,
            totalCharges: 12272362,
            resultatNet: 283388,
            excedentCumule: 16814243,
            deficitCumule: 16305534,
            soldeCumule: 508709,
          },
          autorisees: {
            dotationDemandee: 6388664,
            dotationAccordee: 6106595,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 6333877,
            totalCharges: 6111543,
            resultatNet: 222334,
            excedentCumule: 8582987,
            deficitCumule: 8060705,
            soldeCumule: 522282,
          },
          subventionnees: {
            dotationDemandee: 6398379,
            dotationAccordee: 6019961,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 6221873,
            totalCharges: 6160819,
            resultatNet: 61054,
            excedentCumule: 8231256,
            deficitCumule: 8244829,
            soldeCumule: -13573,
          },
        },
        {
          year: 2025,
          total: {
            dotationDemandee: 6064020,
            dotationAccordee: 6089224,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 16814243,
            deficitCumule: 16305534,
            soldeCumule: 508709,
          },
          autorisees: {
            dotationDemandee: 6064020,
            dotationAccordee: 6089224,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 8582987,
            deficitCumule: 8060705,
            soldeCumule: 522282,
          },
          subventionnees: {
            dotationDemandee: 0,
            dotationAccordee: 0,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 8231256,
            deficitCumule: 8244829,
            soldeCumule: -13573,
          },
        },
        {
          year: 2026,
          total: {
            dotationDemandee: 6273718,
            dotationAccordee: 6298455,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 16814243,
            deficitCumule: 16305534,
            soldeCumule: 508709,
          },
          autorisees: {
            dotationDemandee: 6273718,
            dotationAccordee: 6298455,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 8582987,
            deficitCumule: 8060705,
            soldeCumule: 522282,
          },
          subventionnees: {
            dotationDemandee: 0,
            dotationAccordee: 0,
            totalETP: 0,
            tauxEncadrement: null,
            coutJournalier: null,
            totalProduits: 0,
            totalCharges: 0,
            resultatNet: 0,
            excedentCumule: 8231256,
            deficitCumule: 8244829,
            soldeCumule: -13573,
          },
        },
      ],
    },
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
