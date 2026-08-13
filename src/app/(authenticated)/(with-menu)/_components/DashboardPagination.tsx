"use client";

import { useSearchParams } from "next/navigation";
import { ReactElement } from "react";

import { SimplePagination } from "@/app/components/common/SimplePagination";
import { useDashboardParams } from "@/app/hooks/useDashboardParams";
import { cn } from "@/app/utils/classname.util";
import { getSafePage } from "@/app/utils/list.util";
import { MIDDLE_PAGE_SIZE } from "@/constants";

export const DashboardPagination = ({
  total,
  pageParam,
}: Props): ReactElement | null => {
  const searchParams = useSearchParams();
  const { isPending, setParams } = useDashboardParams();

  const currentPage = getSafePage(
    Number(searchParams.get(pageParam)),
    total,
    MIDDLE_PAGE_SIZE
  );

  const setCurrentPage = (page: number): void => {
    setParams({ [pageParam]: String(page) });
  };

  if (total <= MIDDLE_PAGE_SIZE) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex justify-center mt-4",
        isPending && "pointer-events-none opacity-50"
      )}
    >
      <SimplePagination
        totalElements={total}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={MIDDLE_PAGE_SIZE}
      />
    </div>
  );
};

type Props = {
  total: number;
  pageParam: string;
};
