import { Inject, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { USER_SESSION } from './user-session.provider';
import { UserSession } from './user-session.interface';

/**
 * Resultado de validar la sesión activa.
 */
export interface ValidatedSession {
  tenant: string;
  branchId: number | null;
}

/**
 * Servicio transversal (scope REQUEST) para resolver datos de la sesión del
 * usuario autenticado. Centraliza la lógica que antes se repetía como
 * `getTenant()` / `validateSession()` en cada service y repository.
 *
 * Uso:
 *   constructor(private readonly session: SessionContextService) {}
 *   const tenant = this.session.getTenant();
 *   const { tenant, branchId } = this.session.getValidatedSession();
 */
@Injectable({ scope: Scope.REQUEST })
export class SessionContextService {
  constructor(
    @Inject(USER_SESSION) private readonly userSession: UserSession | null,
  ) {}

  /** Sesión cruda (puede ser null si no hay usuario autenticado). */
  get raw(): UserSession | null {
    return this.userSession;
  }

  /** Indica si hay una empresa (tenant) seleccionada en la sesión. */
  hasTenant(): boolean {
    return !!this.userSession?.tenant_id;
  }

  /**
   * Devuelve el tenant_id de la sesión o lanza UnauthorizedException si no hay
   * empresa seleccionada.
   */
  getTenant(): string {
    if (!this.userSession || !this.userSession.tenant_id) {
      throw new UnauthorizedException('No hay empresa seleccionada en la sesión');
    }
    return this.userSession.tenant_id;
  }
  getRut(): string {
    return this.userSession.rut;
  }
  getdv(): string {
    return this.userSession.dv;
  }
  /** Devuelve la sucursal activa de la sesión (o null). */
  getBranchId(): number | null {
    return this.userSession?.branch_id ?? null;
  }

  /**
   * Valida la sesión y devuelve tenant + branchId. Reemplaza el patrón
   * `validateSession()` repetido en los services.
   */
  getValidatedSession(): ValidatedSession {
    return {
      tenant: this.getTenant(),
      branchId: this.getBranchId(),
    };
  }
}
