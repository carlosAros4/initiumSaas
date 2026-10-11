import { Inject, Injectable, UnauthorizedException, Logger, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { ILoginRepository } from '../types/interfaces/login.repository';
import { SessionRequestDto } from '../types/dto/login-request.dto';
import { SessionPayload } from '../types/dto/login-response.dto';
import { splitRut } from '../../../core/utils/rut.utils';
import { RegisterRequestDto } from '../types/dto/register-request.dto';
import { RegisterResult } from '../types/dto/register';
import { UserSession } from 'src/core/providers/user-session';

const ACCESS_EXPIRES = '7m';
const REFRESH_EXPIRES = '7d';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    @Inject('LOGIN') private readonly repository: ILoginRepository,
  ) { }

  async login(data: SessionRequestDto): Promise<SessionPayload> {
    this.logger.log(`Intento de login — rut: ${data.rut}`);

    const { cuerpo, dv } = splitRut(data.rut);
    const user = await this.repository.findUserByRut(cuerpo, dv);

    if (!user) {
      this.logger.warn(`Usuario no encontrado — rut: ${data.rut}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      this.logger.warn(`Contraseña incorrecta — rut: ${data.rut}`);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    let tokenPayload: UserSession = { sub: user.id, rut: cuerpo, dv: dv };

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

    const accessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: ACCESS_EXPIRES });
    const refreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: REFRESH_EXPIRES });

    this.logger.log(`Login exitoso — userId: ${user.id}`);

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      blocked: user.blocked,
      verified: user.verified,
      newUsers: user.newusers,
    };
  }

  async createUser(data: RegisterRequestDto): Promise<RegisterResult> {
    this.logger.log(`inicio — rut: ${data.rut} | email: ${data.email}`);
    const exists = await this.repository.validateUserExist(data.rut);

    if (exists) {
      this.logger.warn(`RUT ya registrado — rut: ${data.rut}`);
      throw new ConflictException('usuario no disponible');
    }

    const userId = await this.repository.createUser(
      data.rut,
      data.password,
      data.firstName,
      data.lastName,
      data.email,
      data.gender,
    );

    if (!userId) {
      this.logger.error(`No se pudo insertar el usuario — rut: ${data.rut}`);
      throw new Error('No se pudo crear el usuario');
    }

    this.logger.log(`Usuario creado correctamente — rut: ${data.rut}`);

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

    const { cuerpo, dv } = splitRut(data.rut);
    const accessToken = jwt.sign({ sub: userId, rut: cuerpo, dv: dv }, jwtSecret, { expiresIn: ACCESS_EXPIRES });

    this.logger.log(`Token generado para nuevo registro — userId: ${userId}`);
    return { message: 'Usuario creado', accessToken: accessToken };
  }

  // async refreshToken(token: string): Promise<RefreshPayload> {
  //   this.logger.log('Intento de refresh token');

  //   const jwtSecret = process.env.JWT_SECRET;
  //   if (!jwtSecret) throw new Error('JWT_SECRET no configurado');

  //   let decoded: { sub: number; rut: string };
  //   try {
  //     decoded = jwt.verify(token, jwtSecret) as { sub: number; rut: string };
  //   } catch (err) {
  //     this.logger.warn('Refresh token inválido o expirado');
  //     throw new UnauthorizedException('Token inválido o expirado');
  //   }

  //   // Verificar que el usuario siga existiendo
  //   const user = await this.repository.findUserByRut(decoded.rut, '');
  //   // Si no se encuentra con dv vacío, buscar por sub (id) sería ideal,
  //   // pero usamos el rut del token para mantener consistencia
  //   // En este caso validamos solo que el token sea válido y emitimos nuevos tokens

  //   const tokenPayload = { sub: decoded.sub, rut: decoded.rut };

  //   const newAccessToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: ACCESS_EXPIRES });
  //   const newRefreshToken = jwt.sign(tokenPayload, jwtSecret, { expiresIn: REFRESH_EXPIRES });

  //   this.logger.log(`Refresh exitoso — userId: ${decoded.sub}`);

  //   return {
  //     accessToken: newAccessToken,
  //     refreshToken: newRefreshToken,
  //   };
  // }
}
