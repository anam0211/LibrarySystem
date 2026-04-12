export function clone(value) {
  if (value === undefined) {
    return undefined;
  }

  return JSON.parse(JSON.stringify(value));
}

export function readStorage(key, fallbackValue) {
  if (typeof window === "undefined") {
    return clone(fallbackValue);
  }

  const savedValue = window.localStorage.getItem(key);

  if (!savedValue) {
    return clone(fallbackValue);
  }

  try {
    return JSON.parse(savedValue);
  } catch {
    return clone(fallbackValue);
  }
}

export function writeStorage(key, value) {
  if (typeof window === "undefined") {
    return;
  }

  if (value === null || value === undefined) {
    window.localStorage.removeItem(key);
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

export function createEmptyPage() {
  return {
    items: [],
    totalItems: 0,
    totalPages: 0,
    page: 0,
    size: 10,
    first: true,
    last: true
  };
}
