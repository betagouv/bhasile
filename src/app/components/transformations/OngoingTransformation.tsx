import Link from "next/link";

import { formatDate } from "@/app/utils/date.util";
import {
  getReferenceStructureVersionTransformation,
  getStructureVersionTransformationDepartement,
} from "@/app/utils/transformation.util";
import { DEPARTEMENTS } from "@/constants";
import { TransformationApiRead } from "@/schemas/api/transformation.schema";

export const OngoingTransformation = ({
  transformation,
}: {
  transformation: TransformationApiRead;
}): React.ReactNode => {
  const referenceStructureVersionTransformation =
    getReferenceStructureVersionTransformation(transformation);

  const departementNumero = getStructureVersionTransformationDepartement(
    referenceStructureVersionTransformation
  );
  const departementName = DEPARTEMENTS.find(
    (departement) => departement.numero === departementNumero
  )?.name;

  const operateurName =
    referenceStructureVersionTransformation?.operateur?.name;

  const structureCount = transformation.structureVersionTransformations.length;
  const structureTypes = [
    ...new Set(
      transformation.structureVersionTransformations.flatMap(
        (structureVersionTransformation) =>
          structureVersionTransformation.structureVersion?.type
            ? [structureVersionTransformation.structureVersion.type]
            : []
      )
    ),
  ];

  return (
    <li className="grid grid-cols-subgrid col-span-full items-center py-3 border-t border-default-grey text-sm whitespace-nowrap">
      <span>
        {departementName} {departementNumero && `(${departementNumero})`}
      </span>
      <span className="font-bold">{operateurName}</span>
      <span>
        <strong>
          {structureCount} {structureCount > 1 ? "structures" : "structure"}
        </strong>
        {structureTypes.length > 0 && ` (${structureTypes.join(", ")})`}
      </span>
      <span>
        Initiée le{" "}
        <span className="font-bold">
          {formatDate(transformation.createdAt)}
        </span>
      </span>
      <span>
        Modifiée le{" "}
        <span className="font-bold">
          {formatDate(transformation.updatedAt)}
        </span>
      </span>
      <Link
        href={`/structures/transformation/${transformation.id}`}
        className="text-title-blue-france justify-self-end"
        aria-label="Modifier la transformation"
        title="Modifier la transformation"
      >
        <i className="fr-icon-edit-line [&::before]:[--icon-size:20px]!" />
      </Link>
    </li>
  );
};
