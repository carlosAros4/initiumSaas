interface RutParts {
  cuerpo: string;
  dv: string;
}

export function splitRut(rutCompleto: string): RutParts {
  const clean = rutCompleto.replace(/\./g, '');       // quita puntos
  const [cuerpo, dv] = clean.split('-');        // separa por guión

  if (!cuerpo || !dv) {
    throw new Error(`RUT con formato inválido: "${rutCompleto}"`);
  }

  return { cuerpo, dv: dv.toUpperCase() };
}

/**
 * Calcula el dígito verificador esperado de un RUT chileno.
 * @param rut Cuerpo numérico del RUT (sin dv, sin puntos ni guión)
 */
export function calcularDv(rut: string): string {
  let sum = 0;
  let mul = 2;

  for (let i = rut.length - 1; i >= 0; i--) {
    sum += parseInt(rut[i], 10) * mul;
    mul = mul === 7 ? 2 : mul + 1;
  }

  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

/**
 * Valida que un RUT chileno sea correcto (módulo 11).
 * @param rut Cuerpo numérico (sin puntos ni guión)
 * @param dv Dígito verificador
 */
export function validateRut(rut: string, dv: string): boolean {
  if (!/^\d+$/.test(rut)) return false;
  const dvUpper = dv.toUpperCase();
  if (!/^[0-9K]$/.test(dvUpper)) return false;
  return calcularDv(rut) === dvUpper;
}
