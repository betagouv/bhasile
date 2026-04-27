import { vi } from "vitest";

export const mockRouterPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock(
  "@/app/(authenticated)/structures/[id]/finalisation/_components/Tabs",
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
