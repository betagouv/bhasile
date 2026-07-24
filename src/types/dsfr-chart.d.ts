declare module "@gouvfr/dsfr-chart";

namespace JSX {
  interface IntrinsicElements {
    "map-chart": import("react").DetailedHTMLProps<
      import("react").HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      data?: string;
      name?: string;
      level?: string;
      value?: string;
      date?: string;
    };
  }
}
