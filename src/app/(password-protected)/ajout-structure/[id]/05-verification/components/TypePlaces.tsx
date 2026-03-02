import { useParams } from "next/navigation";

import { Table } from "@/app/components/common/Table";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { getTypePlacesYearRange, getYearFromDate } from "@/app/utils/date.util";
import { AjoutIdentificationFormValues } from "@/schemas/forms/ajout/ajoutIdentification.schema";
import { AjoutTypePlacesFormValues } from "@/schemas/forms/ajout/ajoutTypePlaces.schema";

export const TypePlaces = () => {
  const params = useParams();
  const { currentValue: localStorageValues } = useLocalStorage<
    Partial<AjoutTypePlacesFormValues>
  >(`ajout-structure-${params.dnaCode}-type-places`, {});

  const { years } = getTypePlacesYearRange();
  const { currentValue: localStorageIdentificationValues } = useLocalStorage(
    `ajout-structure-${params.dnaCode}-identification`,
    {}
  );
  const yearsToDisplay = years.filter(
    (year) =>
      year >=
      getYearFromDate(
        (localStorageIdentificationValues as AjoutIdentificationFormValues)
          ?.creationDate
      )
  );

  return (
    <Table
      headings={["Année", "Autorisées", "PMR", "LGBT", "FVV/TEH"]}
      ariaLabelledBy=""
      className="[&_th]:px-0 text-center w-1/3"
    >
      {yearsToDisplay.map((year, index) => (
        <tr
          key={year}
          className="w-full [&_input]:max-w-16 border-t border-default-grey "
        >
          <td className="align-middle py-4">{year}</td>
          <td className="py-4!">
            {localStorageValues?.typologies?.[index]?.placesAutorisees}
          </td>
          <td className="py-1!">
            {localStorageValues?.typologies?.[index]?.pmr}
          </td>
          <td className="py-1!">
            {localStorageValues?.typologies?.[index]?.lgbt}
          </td>
          <td className="py-1!">
            {localStorageValues?.typologies?.[index]?.fvvTeh}
          </td>
        </tr>
      ))}
    </Table>
  );
};
