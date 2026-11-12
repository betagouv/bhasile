export type CockpitFeature = {
  title: string;
  description: string;
  icon: string;
  href: string;
  isEnabled: boolean;
};

export type CockpitSection = {
  title: string;
  features: CockpitFeature[];
};
