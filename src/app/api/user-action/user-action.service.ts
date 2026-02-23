import { createUserAction } from "./user-action.repository";

// Les fonctions de ce fichier sont asyncrhones mais il faut les appeler sans
//  await pour ne pas bloquer l'exécution de la requête principale

export const createStructureEvent = async (
  method: string,
  structureId: number
) => {
  await createUserAction({ method, structureId });
};

export const createCpomEvent = async (method: string, cpomId: number) => {
  await createUserAction({ method, cpomId });
};
