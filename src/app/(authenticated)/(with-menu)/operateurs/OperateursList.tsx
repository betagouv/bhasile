"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { Pagination } from "@/app/components/common/Pagination";
import { MIDDLE_PAGE_SIZE } from "@/constants";
import type { OperateurListItem } from "@/types/operateur.type";

import { OperateurItem } from "./OperateurItem";

export const OperateurList = ({
  operateurs,
  totalOperateurs,
}: Props): ReactElement => {
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();

  return (
    <>
      {operateurs.map((operateur) => (
        <Link
          title={`Détails de l'operateur ${operateur.name}`}
          className={`${OPERATEUR_ROW_CLASSES} block`}
          key={operateur.id}
          href={`operateurs/${operateur.id}${queryString ? `?${queryString}` : ""}`}
        >
          <OperateurItem {...operateur} />
        </Link>
      ))}
      <div className="pt-4 flex justify-center items-center">
        <Pagination
          totalElements={totalOperateurs}
          pageSize={MIDDLE_PAGE_SIZE}
        />
      </div>
    </>
  );
};

type Props = {
  operateurs: OperateurListItem[];
  totalOperateurs: number;
};

export const OPERATEUR_ROW_CLASSES = "px-3 pt-3";
