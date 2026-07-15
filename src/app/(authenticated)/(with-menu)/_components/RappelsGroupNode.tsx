"use client";

import { ReactElement, ReactNode, useState } from "react";

import { cn } from "@/app/utils/classname.util";
import { getRappelCriticiteLabel } from "@/app/utils/rappel.util";
import { RappelGroupHeader, RappelGroupNode } from "@/types/dashboard.type";

import { RappelRow } from "./RappelRow";
import { RappelsCountBadge } from "./RappelsCountBadge";

export const RappelsGroupNode = ({ node, depth = 0 }: Props): ReactElement => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={cn(
        "border-b border-default-grey [&:last-child]:border-none",
        depth >= 1 ? "bg-alt-grey" : ""
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-4 py-3 px-6 text-left text-sm"
        style={{ paddingLeft: depth * 24 + 24 }}
      >
        <span className="min-w-0">{renderHeaderLabel(node.header)}</span>
        <span className="flex items-center gap-4">
          <RappelsCountBadge
            count={node.importantCount}
            criticite="IMPORTANT"
          />
          <RappelsCountBadge count={node.urgentCount} criticite="URGENT" />
          <span
            className={
              isOpen ? "fr-icon-arrow-up-s-line" : "fr-icon-arrow-down-s-line"
            }
          />
        </span>
      </button>

      {isOpen &&
        ("children" in node ? (
          <div>
            {node.children.map((child) => (
              <RappelsGroupNode
                key={child.key}
                node={child}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : (
          <div
            className="border-l-2 border-active-blue-france mb-4"
            style={{ marginLeft: depth * 24 + 24, paddingLeft: 24 }}
          >
            {node.rappels.map((rappel) => (
              <RappelRow key={rappel.id} rappel={rappel} />
            ))}
          </div>
        ))}
    </div>
  );
};

const renderHeaderLabel = (header: RappelGroupHeader): ReactNode => {
  switch (header.kind) {
    case "STRUCTURE":
      return (
        <span className="grid grid-cols-[9rem_3.5rem_12rem_minmax(0,1fr)] items-center gap-x-3">
          <strong>{header.structureCodeBhasile}</strong>
          <span>{header.structureType}</span>
          <span className="truncate">{header.operateurName}</span>
          <span className="truncate">
            {header.structureCommune}
            {header.structureDepartement && ` (${header.structureDepartement})`}
          </span>
        </span>
      );
    case "CPOM":
      return (
        <strong>
          {header.cpomLabel}
          {header.cpomDepartements.length > 0 &&
            ` ${header.cpomDepartements.join(", ")}`}
        </strong>
      );
    case "TASK":
      return <strong>{header.taskLabel}</strong>;
    case "CRITICITE":
      return <strong>{getRappelCriticiteLabel(header.criticite)}</strong>;
  }
};

type Props = {
  node: RappelGroupNode;
  depth?: number;
};
