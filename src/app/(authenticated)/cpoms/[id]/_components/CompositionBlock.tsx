"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { computeCpomDates } from "@/app/utils/cpom.util";
import { formatDate } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";

export const CompositionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  const { dateStart, dateEnd } = computeCpomDates(cpom);

  return (
    <Block
      title="Composition"
      iconClass="ri-exchange-2-line"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/composition`);
      }}
    >
      <Table
        headings={["", "Entrée", "", "Sortie", ""]}
        ariaLabelledBy="composition"
        className="max-w-3xl [&_thead_tr]:bg-transparent! [&_thead_tr]:h-12!"
        enableBorders
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
            <td>{formatDate(structure.dateStart ?? dateStart)}</td>
            <td className="text-center!">–</td>
            <td>{formatDate(structure.dateEnd ?? dateEnd)}</td>
            <td className="py-0! pl-0! pr-2!">
              {structure.structure?.forms?.some((form) => form.status) && (
                <Link
                  href={`/structures/${structure.structure?.id}`}
                  className="fr-btn fr-btn--tertiary-no-outline fr-btn-sm fr-icon-arrow-right-line before:w-[20] before:h-[20]"
                  title={`Voir la structure ${structure.structure?.id}`}
                />
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Block>
  );
};
