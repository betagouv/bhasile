import {
    StepStatus,
} from "@/generated/prisma/client";

export const convertToStepStatus = (
    stepStatus: string | null | undefined
): StepStatus => {
    if (!stepStatus) {return StepStatus.NON_COMMENCE;}
    const stepStatuses: Record<string, StepStatus> = {
        'non_commence': StepStatus.NON_COMMENCE,
        'commence': StepStatus.COMMENCE,
        'a_verifier': StepStatus.A_VERIFIER,
        'finalise': StepStatus.FINALISE,
        'valide': StepStatus.VALIDE,
    };
    return stepStatuses[stepStatus.trim().toLowerCase()] || StepStatus.NON_COMMENCE;
};