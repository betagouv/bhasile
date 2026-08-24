"use client";

import { createContext, ReactNode, useContext } from "react";

export const createEntityContext = <TEntity,>(name: string) => {
  const { EntityContext, useValue, useOptionalValue } =
    buildEntityContext<EntityContextValue<TEntity>>(name);

  const Provider = ({ children, entity }: ProviderProps<TEntity>) => (
    <EntityContext value={{ entity }}>{children}</EntityContext>
  );
  Provider.displayName = `${name}Provider`;

  return { Provider, useValue, useOptionalValue };
};

const buildEntityContext = <TValue,>(name: string) => {
  const EntityContext = createContext<TValue | undefined>(undefined);
  EntityContext.displayName = `${name}Context`;

  const useOptionalValue = (): TValue | undefined => useContext(EntityContext);

  const useValue = (): TValue => {
    const value = useContext(EntityContext);

    if (!value) {
      throw new Error(
        `use${name}Context doit être utilisé à l'intérieur d'un ${name}Provider`
      );
    }

    return value;
  };

  return { EntityContext, useValue, useOptionalValue };
};

type EntityContextValue<TEntity> = {
  entity: TEntity;
};

type ProviderProps<TEntity> = {
  children: ReactNode;
  entity: TEntity;
};
