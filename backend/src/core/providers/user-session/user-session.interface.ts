export interface UserSession {
  sub: number;
  rut: string;
  dv: string;
  tenant_id?: string;
  branch_id?: number;
  iat?: number;
  exp?: number;
  session_id?: string;
}
