"use client";

import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { InformationCard } from "@/app/components/InformationCard";
import { formatDate } from "@/app/utils/date.util";
import { pluralize } from "@/app/utils/string.util";
import { CpomStructureAction } from "@/components/CpomStructureAction";
import { NoPermissionsModal } from "@/components/NoPermissionsModal";
import { useCpomContext } from "@/contexts/CpomContext";

export const CompositionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();
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
        {cpom.structures?.map((structure) => (
          <tr key={structure.id}>
            <td className="text-left! h-12!">
              <strong>
                {structure.structure?.codeBhasile} - {structure.structure?.type}{" "}
                {structure.structure?.operateur?.name}{" "}
                {structure.structure?.communeAdministrative}
              </strong>
            </td>
            <td>{formatDate(structure.dateStart ?? cpom.dateStart)}</td>
            <td className="text-center!">–</td>
            <td>{formatDate(structure.dateEnd ?? cpom.dateEnd)}</td>
            <td className="py-0! pl-0! pr-2!">
              {structure.structure && (
                <CpomStructureAction
                  structure={structure.structure}
                  className="before:w-[20] before:h-[20]"
                />
              )}
            </td>
          </tr>
        ))}
      </Table>
      <NoPermissionsModal />
    </Block>
  );
};
