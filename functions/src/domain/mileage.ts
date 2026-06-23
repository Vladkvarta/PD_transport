export function parseMileage(value: string): number | null {
  const normalized = value.replace(/[\s,.]/g, "");

  if (!/^\d{1,7}$/.test(normalized)) {
    return null;
  }

  const mileage = Number(normalized);
  return Number.isSafeInteger(mileage) ? mileage : null;
}

