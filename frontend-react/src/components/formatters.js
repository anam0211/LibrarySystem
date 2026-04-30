export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(date);
}

export function formatDateTime(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(date);
}

export function asSelectOptions(items = [], labelKey = "name", valueKey = "id") {
  return items.map((item) => ({
    label: item?.[labelKey] || `#${item?.[valueKey] || ""}`,
    value: item?.[valueKey]
  }));
}

export function getAvailabilityTag(book) {
  return Number(book?.stockAvailable || 0) > 0 ? "Còn sách" : "Hết sách";
}

export function truncate(value, maxLength = 140) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}
