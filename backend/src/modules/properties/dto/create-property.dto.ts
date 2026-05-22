import { IsString, IsNumber, IsNotEmpty, IsPositive, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es requerido para registrar un inmueble.' })
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  area: number;

  @IsNumber()
  @Min(0)
  rooms: number;

  @IsNumber()
  @Min(0)
  bathrooms: number;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  offerType?: string; // VENTA, ALQUILER, ANTICRETICO, PROYECTO

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  ownerId?: string;

  @IsBoolean()
  @IsOptional()
  hasFolioReal?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCatastro?: boolean;

  @IsBoolean()
  @IsOptional()
  hasTestimonio?: boolean;

  @IsBoolean()
  @IsOptional()
  hasImpuestosAlDia?: boolean;

  @IsBoolean()
  @IsOptional()
  hasPlanoUsoSuelo?: boolean;

  @IsBoolean()
  @IsOptional()
  hasCI?: boolean;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;
}

