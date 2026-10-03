import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ─── Sub-DTOs ─── */

export class BranchDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  address: string | null;

  @ApiPropertyOptional()
  phone: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty()
  is_main: boolean;

  @ApiProperty()
  favorite: boolean;
}

export class CompanyDto {
  @ApiProperty()
  favorite: boolean;

  @ApiProperty()
  blocked: boolean;

  @ApiProperty()
  tenant_id: string;

  @ApiPropertyOptional()
  logo: string | null;

  @ApiProperty()
  id: number;

  @ApiProperty()
  rut: string;

  @ApiProperty()
  dv: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  active: boolean;
}

export class ClienteDataDto {
  @ApiProperty({ type: [CompanyDto] })
  companies: CompanyDto[];

  @ApiProperty()
  userId: number;

  @ApiProperty()
  rut: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  blocked: boolean;

  @ApiProperty()
  verified: boolean;
}

export class PageTreeDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  module: string | null;

  @ApiPropertyOptional()
  url: string | null;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ enum: ['module', 'label', 'link'] })
  type: string;

  @ApiPropertyOptional()
  accessRule: string | null;

  @ApiProperty({ type: [PageTreeDto] })
  children: PageTreeDto[];
}

/* ─── Response DTOs ─── */

/** GET /session */
export class SessionResponseDto {
  @ApiProperty({ type: ClienteDataDto })
  cliente: ClienteDataDto;

  @ApiPropertyOptional({ type: CompanyDto, nullable: true })
  company: CompanyDto | null;

  @ApiPropertyOptional({ type: BranchDto, nullable: true })
  branch?: BranchDto | null;

  @ApiPropertyOptional({ type: [String], nullable: true })
  rules?: string[] | null;

  @ApiPropertyOptional({ type: [PageTreeDto], nullable: true })
  pagetree?: PageTreeDto[] | null;
}

/** POST /session/company */
export class SelectCompanyResponseDto {
  @ApiProperty({ type: CompanyDto })
  company: CompanyDto;

  @ApiProperty({ type: [PageTreeDto] })
  pageTree: PageTreeDto[];

  @ApiProperty({ type: [String] })
  accessRule: string[];

  @ApiProperty({ description: 'Nuevo access token con tenant_id' })
  accessToken: string;

  @ApiProperty({ description: 'Nuevo refresh token con tenant_id' })
  refreshToken: string;

  @ApiProperty({ type: [BranchDto], description: 'Sucursales disponibles para el usuario en esta empresa' })
  branches: BranchDto[];

  @ApiPropertyOptional({ type: BranchDto, nullable: true, description: 'Sucursal auto-seleccionada (favorita o única)' })
  selectedBranch?: BranchDto | null;
}

/** POST /session/branch */
export class SelectBranchResponseDto {
  @ApiProperty({ type: BranchDto })
  branch: BranchDto;

  @ApiProperty({ type: [PageTreeDto] })
  pageTree: PageTreeDto[];

  @ApiProperty({ type: [String] })
  accessRule: string[];

  @ApiProperty({ description: 'Nuevo access token con branch_id' })
  accessToken: string;

  @ApiProperty({ description: 'Nuevo refresh token con branch_id' })
  refreshToken: string;
}

/** Respuesta del refresh token */
export class RefreshResponseDto {
  @ApiProperty()
  message: string;
}

/** Respuesta del logout */
export class LogoutResponseDto {
  @ApiProperty()
  message: string;
}
