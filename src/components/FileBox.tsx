import { ReactElement, ReactNode, Ref } from "react";

import { cn } from "@/app/utils/classname.util";

export const FileBox = ({
  children,
  inputRef,
  accept,
  onFileSelected,
  ariaLabelledBy,
  errorMessage,
  className,
}: Props): ReactElement => (
  <div
    role="group"
    aria-labelledby={ariaLabelledBy}
    className={cn(
      "grid items-center justify-center bg-alt-blue-france py-4 px-8 rounded min-h-16",
      errorMessage && "border-plain-error border-l-2! border-0 rounded-l-none",
      className
    )}
    data-form-error={errorMessage ? true : undefined}
  >
    {children}
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      accept={accept}
      onChange={(event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (file) {
          onFileSelected(file);
        }
      }}
      tabIndex={-1}
      aria-hidden="true"
    />
  </div>
);

type Props = {
  children: ReactNode;
  inputRef: Ref<HTMLInputElement>;
  accept: string;
  onFileSelected: (file: File) => void;
  ariaLabelledBy: string;
  errorMessage?: string;
  className?: string;
};
