"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ReactElement, useEffect, useRef, useState } from "react";

import { Table } from "@/app/components/common/Table";
import { cn } from "@/app/utils/classname.util";
import { ListColumn } from "@/types/ListColumn";

import { OrderButton } from "./OrderButton";

export const ListTableHeadings = ({
  ariaLabelledBy,
  columns,
  children,
}: Props): ReactElement => {
  const router = useRouter();

  const searchParams = useSearchParams();

  const [column, setColumn] = useState<ListColumn["column"] | null>(
    searchParams.get("column") as ListColumn["column"] | null
  );
  const [direction, setDirection] = useState<"asc" | "desc" | null>(
    searchParams.get("direction") as "asc" | "desc" | null
  );

  const handleOrdering = (newColumn: ListColumn["column"]) => {
    if (newColumn === column) {
      if (direction === "asc") {
        setDirection("desc");
      } else {
        setDirection(null);
        setColumn(null);
      }
    } else {
      setColumn(newColumn);
      setDirection("asc");
    }
  };

  const prevColumn = useRef<ListColumn["column"] | null>(null);
  const prevDirection = useRef<"asc" | "desc" | null>(null);

  useEffect(() => {
    if (prevColumn.current !== column || prevDirection.current !== direction) {
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (column) {
        params.set("column", column);
      } else {
        params.delete("column");
      }
      if (direction) {
        params.set("direction", direction);
      } else {
        params.delete("direction");
      }
      router.replace(`?${params.toString()}`);
      prevColumn.current = column;
      prevDirection.current = direction;
    }
  }, [column, direction, searchParams, router]);

  return (
    <Table
      headings={[
        ...columns.map((columnToDisplay) => (
          <th scope="col" key={columnToDisplay.column}>
            <span
              className={cn(
                "flex items-center",
                columnToDisplay.centered && "justify-center"
              )}
            >
              {columnToDisplay.label}
              {columnToDisplay.orderBy && (
                <OrderButton
                  column={columnToDisplay.column}
                  currentColumn={column}
                  currentDirection={direction}
                  handleOrdering={handleOrdering}
                />
              )}
            </span>
          </th>
        )),
        "",
      ]}
      ariaLabelledBy={ariaLabelledBy}
      className="[&_thead_tr]:bg-transparent! [&_thead_tr_th]:text-left [&_thead_tr_th]:h-12"
    >
      {children}
    </Table>
  );
};

type Props = {
  ariaLabelledBy: string;
  columns: ListColumn[];
  children: ReactElement[];
};
