export function formatDate(value) {
  if (!value) {
    return "-";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short"
  }).format(parsedDate);
}

export function formatNumber(value) {
  return new Intl.NumberFormat("vi-VN").format(Number(value || 0));
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function truncate(value, maxLength = 120) {
  if (!value) {
    return "";
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}
