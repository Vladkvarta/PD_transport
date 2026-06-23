import type { DocumentType } from "../types.js";

export const documentTypeLabels: Record<DocumentType, string> = {
  fuelReceipt: "Чек АЗС",
  invoice: "Накладная",
  routeSheet: "Маршрутный лист",
  other: "Другое",
};

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

