import { ReactElement, useMemo, useState } from "react";

import { MapLayout } from "./MapLayout";

export const FranceMap = (): ReactElement => {
  const [decoupage, setDecoupage] = useState<"dep" | "reg">("reg");

  // TODO : remplacer avec les vraies données
  const FAKE_REGIONS_DATA: Record<string, number> = useMemo(
    () => ({
      ARA: 32,
      BFC: 8,
      BRE: 38,
      CVL: 12,
      GES: 67,
      HDF: 89,
      IDF: 0,
      NOR: 23,
      NAQ: 56,
      OCC: 78,
      PDL: 95,
      PAC: 101,
      "971": 21,
      "972": 32,
      "973": 45,
      "974": 78,
      "976": 98,
    }),
    []
  );

  const FAKE_DEPARTEMENTS_DATA: Record<string, number> = useMemo(
    () => ({
      "01": 10,
      "02": 83,
      "03": 67,
      "04": 6,
      "05": 47,
      "06": 96,
      "07": 77,
      "08": 75,
      "09": 57,
      "10": 58,
      "11": 28,
      "12": 33,
      "13": 89,
      "14": 24,
      "15": 5,
      "16": 41,
      "17": 79,
      "18": 8,
      "19": 42,
      "21": 25,
      "22": 26,
      "23": 37,
      "24": 65,
      "25": 88,
      "26": 48,
      "27": 61,
      "28": 80,
      "29": 99,
      "30": 71,
      "31": 5,
      "32": 0,
      "33": 86,
      "34": 19,
      "35": 13,
      "36": 32,
      "37": 59,
      "38": 82,
      "39": 13,
      "40": 78,
      "41": 92,
      "42": 9,
      "43": 22,
      "44": 70,
      "45": 85,
      "46": 58,
      "47": 72,
      "48": 61,
      "49": 27,
      "50": 47,
      "51": 41,
      "52": 44,
      "53": 29,
      "54": 22,
      "55": 4,
      "56": 57,
      "57": 96,
      "58": 46,
      "59": 33,
      "60": 0,
      "61": 15,
      "62": 60,
      "63": 100,
      "64": 98,
      "65": 77,
      "66": 51,
      "67": 67,
      "68": 19,
      "69": 44,
      "70": 92,
      "71": 93,
      "72": 51,
      "73": 32,
      "74": 19,
      "75": 96,
      "76": 91,
      "77": 21,
      "78": 48,
      "79": 72,
      "80": 52,
      "81": 48,
      "82": 57,
      "83": 38,
      "84": 23,
      "85": 46,
      "86": 37,
      "87": 64,
      "88": 78,
      "89": 72,
      "90": 85,
      "91": 87,
      "92": 46,
      "93": 89,
      "94": 18,
      "95": 56,
      "971": 48,
      "972": 64,
      "973": 6,
      "974": 70,
      "976": 38,
    }),
    []
  );

  return (
    <MapLayout
      zoneData={
        decoupage === "dep" ? FAKE_DEPARTEMENTS_DATA : FAKE_REGIONS_DATA
      }
      departementsData={FAKE_DEPARTEMENTS_DATA}
      decoupage={decoupage}
      setDecoupage={setDecoupage}
    />
  );
};
