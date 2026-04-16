import {
  Fragment,
  PropsWithChildren,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";

import { cn } from "@/app/utils/classname.util";

export const Table = ({
  children,
  title,
  headings,
  preHeadings,
  ariaLabelledBy,
  className,
  enableBorders,
  hasErrors,
  stickFirstColumn,
}: Props) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const scrollableAreaRef = useRef<HTMLDivElement>(null);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  const [scrollReachedEnd, setScrollReachedEnd] = useState(false);

  useEffect(() => {
    const container = scrollableAreaRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      const hasReachedEnd = container.scrollLeft < 10;
      setScrollReachedEnd(hasReachedEnd);
    };

    handleScroll(); // état initial
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={tableContainerRef}
      className={cn(
        "bg-lifted-grey",
        "rounded-lg border border-default-grey",
        "[&_th]:uppercase [&_th_small]:block [&_th_tr]:text-mention-grey [&_th]:py-2 [&_th]:px-4 [&_th]:text-center [&_th]:text-xs",
        "[&_td]:py-2 [&_td]:px-4 [&_td]:text-center [&_td]:text-sm ",
        enableBorders &&
          "[&_tr]:border-b [&_tbody_tr:last-child]:border-b-0 [&_th]:border-default-grey [&_tr]:border-default-grey [&_td]:border-default-grey",
        hasErrors && "border-action-high-error",
        className
      )}
    >
      <div
        ref={scrollableAreaRef}
        className="w-full max-w-full min-w-0 overflow-x-auto"
        style={{ contain: "inline-size" }}
      >
        <table
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "min-w-full",
            stickFirstColumn &&
              " [&_tr>*:first-child]:sticky [&_tr>*:first-child]:left-0 [&_tr>*:first-child]:bg-white [&_tr>*:first-child]:z-20",
            "[&_tr>*:first-child]:before:content-[''] [&_tr>*:first-child]:before:absolute [&_tr>*:first-child]:before:-right-[6em] [&_tr>*:first-child]:before:top-0 [&_tr>*:first-child]:before:bottom-0 [&_tr>*:first-child]:before:w-[6em]",
            "[&_tr>*:first-child]:before:bg-linear-to-l [&_tr>*:first-child]:before:from-transparent [&_tr>*:first-child]:before:to-white",
            "[&_tr>*:first-child]:before:opacity-100 [&_tr>*:first-child]:before:transition-opacity [&_tr>*:first-child]:before:duration-30",
            stickFirstColumn &&
              scrollReachedEnd &&
              "[&_tr>*:first-child]:before:opacity-0"
          )}
        >
          {title && <caption>{title}</caption>}

          <thead>
            {preHeadings && (
              <tr className="bg-default-grey-hover">
                {preHeadings?.map((preHeading, index) =>
                  typeof preHeading === "string" ? (
                    <th scope="col" key={`col-${index}`}>
                      {preHeading}
                    </th>
                  ) : (
                    <Fragment key={index}>{preHeading}</Fragment>
                  )
                )}
              </tr>
            )}
            {headings && (
              <tr className={cn(!preHeadings && "bg-default-grey-hover")}>
                {headings?.map((heading, index) =>
                  typeof heading === "string" ? (
                    <th scope="col" key={`col-${index}`}>
                      {heading}
                    </th>
                  ) : (
                    <Fragment key={index}>{heading}</Fragment>
                  )
                )}
              </tr>
            )}
          </thead>
          <tbody className="[&>tr>td]:py-1 [&>tr>td]:px-4 [&>tr>td]:text-center [&>tr>td]:text-sm">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Table.displayName = "Table";

type Props = PropsWithChildren<{
  title?: string;
  headings: (string | ReactElement)[];
  preHeadings?: (string | ReactElement)[];
  ariaLabelledBy: string;
  className?: string;
  enableBorders?: boolean;
  hasErrors?: boolean;
  stickFirstColumn?: boolean;
}>;
