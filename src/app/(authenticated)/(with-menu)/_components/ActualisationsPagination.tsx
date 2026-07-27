"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useTransition } from "react";

import { SimplePagination } from "@/app/components/common/SimplePagination";
import { MIDDLE_PAGE_SIZE } from "@/constants";

export const ActualisationsPagination = ({ total }: Props): ReactElement => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const lastPage = Math.max(0, Math.ceil(total / MIDDLE_PAGE_SIZE) - 1);
  const rawPage = Number(searchParams.get("actualisationsPage")) || 0;
  const currentPage = Math.min(Math.max(0, rawPage), lastPage);

  const setCurrentPage = (page: number): void => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("actualisationsPage", String(page));
      router.replace(`?${params.toString()}`);
    });
  };

  return (
    <div className={isPending ? "pointer-events-none opacity-50" : ""}>
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
};
