export function formatNumber(value: number | string | bigint): string {
  const n = Number(value);
  if (!isFinite(n)) return String(value);
  try {
    return n.toLocaleString("fr");
  } catch (e) {
    return String(value);
  }
}

export default formatNumber;
