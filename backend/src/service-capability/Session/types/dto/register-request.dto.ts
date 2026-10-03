import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber } from 'class-validator';

export class CompanyRequestDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty()
  @IsBoolean()
  favorite: boolean;
}

export class BranchRequestDto {
  @ApiProperty({ description: 'ID de la sucursal a seleccionar' })
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @ApiProperty({ description: 'Marcar/desmarcar como sucursal favorita' })
  @IsBoolean()
  favorite: boolean;
}
