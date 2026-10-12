
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

/**
 * Une un cuerpo de RUT y su dígito verificador en el formato estándar chileno.
 * Ej: formatRutDv('12345678', '9') -> '12.345.678-9'
 *
 * @param rut cuerpo del RUT (puede venir con puntos/guion; se limpia).
 * @param dv  dígito verificador (0-9 o K).
 * @returns RUT formateado, o '' si no hay cuerpo.
 */
export function formatRutDv(rut: string | number, dv: string): string {
  const body = String(rut).replace(/[^0-9]/g, '');
  if (body.length === 0) return '';
  const cleanDv = String(dv).replace(/[^0-9kK]/g, '').toUpperCase();
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return cleanDv ? `${formatted}-${cleanDv}` : formatted;
}
