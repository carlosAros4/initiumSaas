import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { Company } from './login';

/** Respuesta para type=1: accessToken viaja en el body */
export class SessionResponseDto {
  @ApiProperty()
  @Expose()
  accessToken: string;
}

/** Payload interno que el service devuelve al controller */
export interface SessionPayload {
  accessToken: string;
  refreshToken: string;
  userId: number;
  verified: boolean;
  blocked: boolean;
  newUsers: boolean;
  companies?:Company[];
}

/** Payload que devuelve el refresh token */
export interface RefreshPayload {
  accessToken: string;
  refreshToken: string;
}
