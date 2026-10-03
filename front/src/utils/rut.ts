
// ── RUT utils ──────────────────────────────────────────────
export function calcDv(rut: number): string {
  let sum = 0;
  let mul = 2;
  let n = rut;
  while (n > 0) {
    sum += (n % 10) * mul;
    n = Math.floor(n / 10);
    mul = mul === 7 ? 2 : mul + 1;
  }
  const res = 11 - (sum % 11);
  if (res === 11) return '0';
  if (res === 10) return 'K';
  return String(res);
}

export function formatRut(raw: string): string {
  // Deja solo dígitos y K
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length === 0) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  // Agrega puntos cada 3 dígitos
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

export function validateRut(raw: string): boolean {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return false;
  const body = parseInt(clean.slice(0, -1), 10);
  const dv = clean.slice(-1);
  if (isNaN(body)) return false;
  return calcDv(body) === dv;
}