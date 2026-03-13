"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Block } from "@/app/components/common/Block";
import { Table } from "@/app/components/common/Table";
import { formatDate } from "@/app/utils/date.util";

import { useCpomContext } from "../_context/CpomClientContext";

export const CompositionBlock = () => {
  const { cpom } = useCpomContext();
  const router = useRouter();

  return (
    <Block
      title="Composition"
      iconClass="fr-icon-align-left"
      onEdit={() => {
        router.push(`/cpoms/${cpom.id}/modification/composition`);
      }}
    >
      <Table
        headings={["", "Entrée", "Sortie", ""]}
        ariaLabelledBy="composition"
        className="max-w-3xl"
        enableBorders
      >
        {cpom.structures?.map((structure) => (
          <tr key={structure.id}>
            <td className="text-left! h-11!">
              <strong>{structure.structure?.dnaCode}</strong>
            </td>
            <td>{formatDate(structure.dateStart ?? undefined)}</td>
            <td>{formatDate(structure.dateEnd ?? undefined)}</td>
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
