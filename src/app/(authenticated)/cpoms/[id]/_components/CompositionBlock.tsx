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
        headings={["", "Entrée", "Sortie", ""]}
        ariaLabelledBy="composition"
        className="max-w-3xl [&_thead_tr]:!bg-transparent [&_thead_tr]:!h-12"
        enableBorders
      >
        {cpom.structures?.map((structure) => (
          <tr key={structure.id}>
            <td className="text-left! h-11!">
              <strong>{structure.structure?.dnaCode}</strong>
            </td>
            <td>{formatDate(structure.dateStart ?? dateStart)}</td>
            <td>{formatDate(structure.dateEnd ?? dateEnd)}</td>
            <td className="p-0!">
              {structure.structure?.forms?.some((form) => form.status) && (
                <Link
                  href={`/structures/${structure.structure?.id}`}
                  className="fr-btn fr-btn--tertiary-no-outline fr-btn-sm fr-icon-arrow-right-line"
                >
                  Voir
                </Link>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </Block>
  );
};
