import { attachCatalogStore } from "./catalog/catalog.store.js";
import { attachOperationsStore } from "./operations/operations.store.js";

export function createAppStore() {
  const cache = {};
  const store = {};

  Object.assign(store, attachOperationsStore(cache));
  Object.assign(store, attachCatalogStore(store, cache));

  return store;
}
