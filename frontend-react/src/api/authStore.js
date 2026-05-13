const SESSION_KEY = "library.react.session.v1";

export function normalizeSession(payload) {
  return {
    token: String(payload?.token || "").trim(),
    type: payload?.type || "Bearer",
    id: payload?.id,
    email: payload?.email || "",
    fullName: payload?.fullName || payload?.name || "",
    role: payload?.role || "READER",
    phone: payload?.phone || "",
    studentCode: payload?.studentCode || "",
    kycStatus: payload?.kycStatus || "NEW"
  };
}

export function readSession() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    return parsedValue?.token ? parsedValue : null;
  } catch {
    return null;
  }
}

export function writeSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session?.token) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function getDefaultRoute(role) {
  if (role === "READER") {
    return "/reader";
  }

  if (role === "LIBRARIAN") {
    return "/loans/pickup";
  }

  if (role === "ADMIN") {
    return "/dashboard";
  }

  return "/dashboard";
}
