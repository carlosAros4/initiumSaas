import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SessionRequestDto {
  @ApiProperty({ description: 'RUT con formato 12.345.678-9' })
  @IsString()
  @IsNotEmpty()
  rut: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty()
  @IsBoolean()
  isLogin: boolean;

}
