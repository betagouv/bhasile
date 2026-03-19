import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";

export const Codes = (): ReactElement => {
  const { structure } = useStructureContext();

  const { dnaStructures, finesses } = structure;

  return (
    <>
      {dnaStructures && dnaStructures.length > 0 && (
        <table className="mb-8 whitespace-nowrap">
          <caption className="text-title-blue-france text-lg mb-3 text-left font-bold">
            Codes DNA
          </caption>
          <tbody>
            {dnaStructures.map((dnaStructure) => (
              <tr
                key={dnaStructure.id}
                className="border-b border-default-grey last:border-b-0"
              >
                <td className="py-3 pr-8 italic">{dnaStructure.dna.code}</td>
                <td className="py-3 w-full">{dnaStructure.dna.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {finesses && finesses.length > 0 && (
        <table className="whitespace-nowrap">
          <caption className="text-title-blue-france text-lg mb-3 text-left font-bold">
            Codes FINESS
          </caption>
          <tbody>
            {finesses.map((finess) => (
              <tr
                key={finess.id}
                className="border-b border-default-grey last:border-b-0"
              >
                <td className="py-3 pr-8 italic">{finess.code}</td>
                <td className="py-3 w-full">{finess.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
};
