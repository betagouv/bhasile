export type Departement = {
  numero: string;
  name: string;
  region: string;
  population: number | null;
};

export type Region = {
  code: string;
  name: string;
  show: boolean;
};
