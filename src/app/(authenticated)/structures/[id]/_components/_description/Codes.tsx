import { ReactElement } from "react";

import { useStructureContext } from "../../_context/StructureClientContext";

export const Codes = (): ReactElement => {
  const { structure } = useStructureContext();

  const { dnaStructures, finesses } = structure;

  return (
    <>
      {dnaStructures && (
        <>
          <h4 className="text-title-blue-france text-lg mb-3">Codes DNA</h4>
          <table className="mb-8 whitespace-nowrap">
            <tbody>
              {dnaStructures.map((dnaStructure) => (
                <tr
                  key={dnaStructure.id}
                  className="border-b border-default-grey last:border-b-0"
                >
                  <td className="py-3 pr-8 italic">{dnaStructure.dna.code}</td>
                  <td className="py-3 w-full">
                    {dnaStructure.dna.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
      {finesses && (
        <>
          <h4 className="text-title-blue-france text-lg mb-3">Codes FINESS</h4>
          <table className="whitespace-nowrap">
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
        </>
      )}
    </>
  );
};
