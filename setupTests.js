import "@testing-library/jest-dom/vitest";

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  });
}

if (
  typeof HTMLElement !== "undefined" &&
  !HTMLElement.prototype.scrollIntoView
) {
  HTMLElement.prototype.scrollIntoView = () => {};
}

// Le runtime DSFR n'est pas chargé en jsdom : createModal().open()/close() l'appellent.
if (typeof window !== "undefined" && !window.dsfr) {
  window.dsfr = () => ({ modal: { disclose: () => {}, conceal: () => {} } });
}

// Node 26 expose un localStorage/sessionStorage global, vide sans --localstorage-file.
// Vitest ne recopie pas depuis jsdom les clés déjà présentes sur globalThis, donc les
// storages restent ceux de Node, à undefined. window pointe sur globalThis une fois
// l'environnement installé : les vrais storages ne sont atteignables que via globalThis.jsdom.
if (globalThis.jsdom && !globalThis.localStorage) {
  for (const storageName of ["localStorage", "sessionStorage"]) {
    Object.defineProperty(globalThis, storageName, {
      value: globalThis.jsdom.window[storageName],
      configurable: true,
      writable: true,
    });
  }
}
