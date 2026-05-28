import { IsUUID, IsNotEmpty, IsDateString, IsNumber, IsPositive, IsOptional, IsEnum, IsString } from 'class-validator';

export class CreateContractDto {
  @IsUUID(undefined, { message: 'El ID de la propiedad debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID de la propiedad es obligatorio.' })
  propertyId: string;

  @IsUUID(undefined, { message: 'El ID del inquilino debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del inquilino es obligatorio.' })
  tenantId: string;

  @IsUUID(undefined, { message: 'El ID del propietario debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del propietario es obligatorio.' })
  ownerId: string;

  @IsDateString({}, { message: 'La fecha de inicio debe tener un formato de fecha válido (ISO 8601).' })
  @IsNotEmpty({ message: 'La fecha de inicio es obligatoria.' })
  startDate: string;

  @IsDateString({}, { message: 'La fecha de finalización debe tener un formato de fecha válido (ISO 8601).' })
  @IsNotEmpty({ message: 'La fecha de finalización es obligatoria.' })
  endDate: string;

  @IsNumber({}, { message: 'El monto mensual debe ser un valor numérico.' })
  @IsPositive({ message: 'El monto mensual debe ser un número positivo mayor que cero.' })
  @IsNotEmpty({ message: 'El monto mensual es obligatorio.' })
  monthlyAmount: number;

  @IsEnum(['VIGENTE', 'VENCIDO', 'RESCINDIDO'], { message: 'El estado del contrato debe ser VIGENTE, VENCIDO o RESCINDIDO.' })
  @IsOptional()
  status?: 'VIGENTE' | 'VENCIDO' | 'RESCINDIDO';

  @IsString({ message: 'Las observaciones deben ser una cadena de texto.' })
  @IsOptional()
  observations?: string;
}
