export function formatNumber(value: number | string | bigint): string {
  const n = Number(value);
  if (!isFinite(n)) return String(value);
  try {
    return n.toLocaleString("fr");
  } catch {
    return String(value);
  }
}

export default formatNumber;
