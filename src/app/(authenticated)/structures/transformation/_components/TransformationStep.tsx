import Link from "next/link";
import { usePathname } from "next/navigation";

import { TransformationStructureIcon } from "@/app/components/transformations/TransformationStructureIcon";
import { cn } from "@/app/utils/classname.util";
import {
  getStructureVersionTransformationLabel,
  Step,
} from "@/app/utils/transformation.util";
import { StepStatus } from "@/types/form.type";

import { useOptionalTransformationContext } from "../[transformationId]/_context/TransformationClientContext";

export const TransformationStep = ({ step }: Props) => {
  const pathname = usePathname();
  const { shouldShowIncompleteSteps } = useOptionalTransformationContext();
  return (
    <div className="relative">
      <span
        aria-hidden
        className="absolute left-[3.1rem] top-0 bottom-0 w-[1.5px] bg-[radial-gradient(circle,#6b7cff_0.5px,transparent_1px)] bg-[length:1.5px_5px] bg-repeat-y bg-top"
      />
      <div className="relative flex items-center gap-3 uppercase font-bold text-xs text-title-blue-france pl-9 mb-2">
        <span
          className={cn(
            "flex items-center justify-center w-7 h-7 rounded-full bg-white text-title-blue-france"
          )}
        >
          <TransformationStructureIcon type={step.type} />
        </span>
        {getStructureVersionTransformationLabel(step.type, step.codeBhasile)}
      </div>
      <div className="flex flex-col gap-2">
        {step.steps.map((stepItem) => {
          const isActive = stepItem.route && pathname.includes(stepItem.route);
          const showIncompleteBadge =
            shouldShowIncompleteSteps &&
            stepItem.status !== StepStatus.VALIDE;
          return (
            <Link
              key={stepItem.route}
              href={stepItem.route}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 py-2 pl-19 pr-4 hover:font-bold text-sm hover:bg-white",
                isActive ? "bg-white" : ""
              )}
            >
              {stepItem.label}
              {showIncompleteBadge && (
                <>
                  <span className="sr-only">Étape non complétée</span>
                  <span
                    aria-hidden
                    className="w-2 h-2 rounded-full bg-[var(--color-background-flat-error)] shrink-0"
                  />
                </>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

type Props = {
  step: Step;
};
