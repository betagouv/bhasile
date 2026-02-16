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
  stickLastColumn,
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
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      const hasReachedEnd = Math.abs(container.scrollLeft - maxScrollLeft) < 1;
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
        "w-full bg-lifted-grey overflow-hidden",
        "rounded-lg border border-default-grey",
        "[&_th]:uppercase [&_th_small]:block [&_th_tr]:text-mention-grey [&_th]:py-2 [&_th]:px-4 [&_th]:text-center [&_th]:text-xs",
        "[&_td]:py-2 [&_td]:px-4 [&_td]:text-center [&_td]:text-sm ",
        enableBorders &&
          "[&_tr]:border-b [&_tbody_tr:last-child]:border-b-0 [&_th]:border-default-grey [&_tr]:border-default-grey [&_td]:border-default-grey",
        hasErrors && "border-action-high-error",
        className
      )}
    >
      <div ref={scrollableAreaRef} className={cn("overflow-x-auto")}>
        <table
          aria-labelledby={ariaLabelledBy}
          className={cn(
            "w-full",
            stickLastColumn &&
              " [&_tr>*:last-child]:sticky [&_tr>*:last-child]:right-0 [&_tr>*:last-child]:bg-white [&_tr>*:last-child]:z-20",
            "[&_tr>*:last-child]:before:content-[''] [&_tr>*:last-child]:before:absolute [&_tr>*:last-child]:before:-left-[6em] [&_tr>*:last-child]:before:top-0 [&_tr>*:last-child]:before:bottom-0 [&_tr>*:last-child]:before:w-[6em]",
            "[&_tr>*:last-child]:before:bg-linear-to-l [&_tr>*:last-child]:before:from-white [&_tr>*:last-child]:before:to-transparent",
            "[&_tr>*:last-child]:before:opacity-100 [&_tr>*:last-child]:before:transition-opacity [&_tr>*:last-child]:before:duration-30",
            stickLastColumn &&
              scrollReachedEnd &&
              "[&_tr>*:last-child]:before:opacity-0"
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
          <tbody className="[&>tr>td]:py-2 [&>tr>td]:px-4 [&>tr>td]:text-center [&>tr>td]:text-sm">
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
  stickLastColumn?: boolean;
}>;
