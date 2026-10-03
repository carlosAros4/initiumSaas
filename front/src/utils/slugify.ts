/**
 * Convierte un nombre de empresa a un slug URL-friendly.
 * Ej: "Mi Clínica S.A." → "mi-clinica-sa"
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quitar acentos
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // reemplazar no-alfanuméricos por guión
    .replace(/^-+|-+$/g, '');        // quitar guiones al inicio/final
}
