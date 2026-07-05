import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum ClientCategory {
  PROSPECTO = 'Prospecto',
  PROPIETARIO = 'Propietario',
}

export enum ClientPriority {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
}

export enum ClientStage {
  NUEVO = 'Nuevo',
  CONTACTADO = 'Contactado',
  VISITA_PROGRAMADA = 'Visita Programada',
  NEGOCIACION = 'Negociación',
  RESERVADO = 'Reservado',
  CERRADO = 'Cerrado',
}

export class CreateClientDto {
  // ── BLOQUE 1: Datos Básicos ──────────────────────────────
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  source?: string; // WhatsApp | TikTok | Instagram | Recomendado | RED PROPIO

  @IsEnum(ClientCategory)
  @IsOptional()
  category?: ClientCategory;

  // ── BLOQUE 2: Intención de Compra ────────────────────────
  @IsString()
  @IsOptional()
  interest?: string; // Descripción libre de la propiedad de interés

  @IsNumber()
  @Min(0)
  @IsOptional()
  budget?: number;

  @IsEnum(ClientPriority)
  @IsOptional()
  priority?: ClientPriority;

  // ── BLOQUE 3: Pipeline / Estado ──────────────────────────
  @IsEnum(ClientStage)
  @IsOptional()
  stage?: ClientStage;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  agentId?: string; // Se saca del JWT en el servicio
}
