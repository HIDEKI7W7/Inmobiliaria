import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class SocialMockDto {
  @IsIn(['GOOGLE', 'FACEBOOK', 'APPLE'], { message: 'Proveedor social inválido.' })
  provider: 'GOOGLE' | 'FACEBOOK' | 'APPLE';

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido.' })
  email: string;

  @IsOptional()
  @IsString({ message: 'El providerId debe ser texto.' })
  @MinLength(3, { message: 'El providerId debe tener al menos 3 caracteres.' })
  providerId?: string;

  @IsOptional()
  @IsString({ message: 'El nombre debe ser texto.' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  name?: string;
}
