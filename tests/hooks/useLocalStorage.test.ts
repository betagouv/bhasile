import { act, renderHook } from "@testing-library/react";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalStorage } from "@/app/hooks/useLocalStorage";

// Sauvegarder la référence originale de localStorage
const originalLocalStorage = window.localStorage;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
  };
})();

// Utiliser vi.mock pour remplacer localStorage
vi.stubGlobal("localStorage", localStorageMock);

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  // Restaurer la valeur originale après tous les tests
  afterAll(() => {
    vi.stubGlobal("localStorage", originalLocalStorage);
  });

  it("utilise la valeur initiale quand le localStorage est vide", () => {
    // GIVEN
    const key = "testKey";
    const initialValue = { name: "John", age: 30 };

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    // THEN
    expect(result.current.currentValue).toEqual(initialValue);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
  });

  it("récupère la valeur du localStorage si elle existe", () => {
    // GIVEN
    const key = "testKey";
    const storedValue = { name: "Jane", age: 25 };
    const initialValue = { name: "John", age: 30 };

    // Setup localStorage with a value
    localStorageMock.getItem.mockReturnValueOnce(JSON.stringify(storedValue));

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    // THEN
    expect(result.current.currentValue).toEqual(storedValue);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
  });

  it("met à jour le localStorage quand la valeur change", () => {
    // GIVEN
    const key = "testKey";
    const initialValue = { name: "John", age: 30 };
    const newValue = { name: "Jane", age: 25 };

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    act(() => {
      result.current.updateLocalStorageValue(newValue);
    });

    // THEN
    expect(result.current.currentValue).toEqual(newValue);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      key,
      JSON.stringify(newValue)
    );
  });

  it("gère les erreurs du localStorage lors de la lecture", () => {
    // GIVEN
    const key = "testKey";
    const initialValue = { name: "John", age: 30 };

    // Mock console.error
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Force an error when getting from localStorage
    localStorageMock.getItem.mockImplementationOnce(() => {
      throw new Error("getItem error");
    });

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    // THEN
    expect(result.current.currentValue).toEqual(initialValue);
    expect(localStorageMock.getItem).toHaveBeenCalledWith(key);
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("gère les erreurs du localStorage lors de l'écriture", () => {
    // GIVEN
    const key = "testKey";
    const initialValue = { name: "John", age: 30 };
    const newValue = { name: "Jane", age: 25 };

    // Mock console.error
    const originalConsoleError = console.error;
    console.error = vi.fn();

    // Force an error when setting to localStorage
    localStorageMock.setItem.mockImplementationOnce(() => {
      throw new Error("setItem error");
    });

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    // Update the value
    act(() => {
      result.current.updateLocalStorageValue(newValue);
    });

    // THEN
    expect(console.error).toHaveBeenCalled();

    // Restore console.error
    console.error = originalConsoleError;
  });

  it("gère proprement une clé null", () => {
    // GIVEN
    const key = null;
    const initialValue = { name: "John", age: 30 };
    const newValue = { name: "Jane", age: 25 };

    // WHEN
    const { result } = renderHook(() => useLocalStorage(key, initialValue));

    // THEN - Initial state should be undefined
    expect(result.current.currentValue).toBeUndefined();
    expect(localStorageMock.getItem).not.toHaveBeenCalled();

    // Update the value - should not affect localStorage
    act(() => {
      result.current.updateLocalStorageValue(newValue);
    });

    expect(result.current.currentValue).toBeUndefined();
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });
});
