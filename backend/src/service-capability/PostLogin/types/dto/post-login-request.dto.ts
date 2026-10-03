import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

/**
 * Body opcional del endpoint post-login.
 */
export class PostLoginRequestDto {
  @ApiPropertyOptional({
    description:
      'tenant_id de la empresa a seleccionar en la sesión (opcional). ' +
      'Útil tras crear una empresa para ingresar directamente a ella.',
  })
  @IsOptional()
  @IsString()
  tenant_id?: string;
}
