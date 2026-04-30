import { vi } from "vitest";

export const mockRouterPush = vi.fn();

vi.mock(
  "@/app/(authenticated)/(with-menu)/structures/[id]/finalisation/_components/Tabs",
  () => ({ Tabs: () => <div>Tabs</div> })
);

vi.mock("@/app/components/SubmitError", () => ({
  SubmitError: () => <div>Submit error</div>,
}));

vi.mock("@/app/components/ui/InformationBar", () => ({
  InformationBar: () => <div>Information bar</div>,
}));

vi.mock("@/app/components/forms/ModificationTitle", () => ({
  ModificationTitle: () => <div>Modification title</div>,
}));

vi.mock("@/app/components/forms/LeaveModificationModal", () => ({
  LeaveModificationModal: () => <div>Leave modal</div>,
}));
