import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterRequestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  rut: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  email: string;
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  firstName: string;
  @ApiProperty()
  @IsString()
  lastName: string;

}
