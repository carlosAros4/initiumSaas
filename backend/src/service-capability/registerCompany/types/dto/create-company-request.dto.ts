import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyRequestDto {
  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Tipo de empresa (id)' })
  @Type(() => Number)
  @IsNumber()
  type: number;

  @ApiProperty({ description: 'RUT de la empresa con dígito verificador (ej: 12345678-9)' })
  @IsString()
  @IsNotEmpty()
  rut: string;

  @ApiProperty({ description: 'Nombre de la sucursal/sede principal' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  branchName: string;

  @ApiPropertyOptional({ description: 'token para ingresar a la session' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  token?: string;

  @ApiPropertyOptional({ description: 'refresh de session' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh?: string;
}
