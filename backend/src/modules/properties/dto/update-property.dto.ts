import { IsString, IsNumber, IsNotEmpty, IsPositive, Min, IsOptional, IsBoolean, MaxLength, IsUrl } from 'class-validator';

export class UpdatePropertyDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000, { message: 'La descripción no puede superar los 5000 caracteres.' })
  description?: string;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  minPrice?: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  area?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  rooms?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  bathrooms?: number;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  offerType?: string; // VENTA, ALQUILER, ANTICRETICO, PROYECTO

  @IsString()
  @IsOptional()
  type?: string; // DEPARTAMENTO, CASA, TERRENO, OFICINA, LOCAL_COMERCIAL, EDIFICIO

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

  @IsString()
  @IsOptional()
  currency?: string;
}
