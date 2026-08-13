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
