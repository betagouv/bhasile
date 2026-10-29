"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { InformationCard } from "@/app/components/InformationCard";
import {
  useCanReadStructures,
  useCanUpdateStructures,
} from "@/app/hooks/useCanUpdateStructure";
import { formatDate } from "@/app/utils/date.util";
import { pluralize } from "@/app/utils/string.util";
import { useCpomContext } from "@/contexts/CpomContext";
import { getCpomStructureLink } from "@/utils/structure-link.util";

export const CompositionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();
  const canReadStructure = useCanReadStructures();
  const canUpdateStructure = useCanUpdateStructures();
  const structureCount = cpom.structures?.length ?? 0;

  return (
    <Block
      title="Composition"
      iconClass="ri-exchange-2-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/composition`);
      }}
      entity={cpom}
      entityType="Cpom"
    >
      <div className="flex mb-6">
        <InformationCard
          primaryInformation={structureCount}
          secondaryInformation={pluralize(structureCount, "structure")}
        />
      </div>
      <Table
        headings={["", "Entrée", "", "Sortie", ""]}
        ariaLabelledBy="composition"
        className="[&_thead_tr]:bg-transparent! [&_thead_tr]:h-12!"
        enableBorders
        stickFirstColumn
        firstColumnWidth="30rem"
      >
        {cpom.structures?.map((structure) => {
          const link =
            structure.structure &&
            getCpomStructureLink(structure.structure, {
              canReadStructure,
              canUpdateStructure,
            });
          return (
            <tr key={structure.id}>
              <td className="text-left! h-12!">
                <strong>
                  {structure.structure?.codeBhasile} -{" "}
                  {structure.structure?.type}{" "}
                  {structure.structure?.operateur?.name}{" "}
                  {structure.structure?.communeAdministrative}
                </strong>
              </td>
              <td>{formatDate(structure.dateStart ?? cpom.dateStart)}</td>
              <td className="text-center!">–</td>
              <td>{formatDate(structure.dateEnd ?? cpom.dateEnd)}</td>
              <td className="py-0! pl-0! pr-2!">
                {link && (
                  <Link
                    href={link.href}
                    className={`fr-btn fr-btn--tertiary-no-outline fr-btn-sm ${link.isFinalisation ? "fr-icon-edit-line" : "fr-icon-arrow-right-line"} before:w-[20] before:h-[20]`}
                    title={link.title}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </Table>
    </Block>
  );
};
