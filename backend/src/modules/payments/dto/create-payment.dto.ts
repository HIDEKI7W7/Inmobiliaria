import { IsUUID, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsString, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @IsUUID(undefined, { message: 'El ID del contrato debe ser un UUID válido.' })
  @IsNotEmpty({ message: 'El ID del contrato es obligatorio.' })
  contractId: string;

  @IsNumber({}, { message: 'El monto del pago debe ser un valor numérico.' })
  @IsPositive({ message: 'El monto del pago debe ser un número positivo mayor que cero.' })
  @IsNotEmpty({ message: 'El monto del pago es obligatorio.' })
  amount: number;

  @IsDateString({}, { message: 'La fecha de pago debe tener un formato de fecha válido (ISO 8601).' })
  @IsNotEmpty({ message: 'La fecha de pago es obligatoria.' })
  paymentDate: string;

  @IsString({ message: 'El método de pago debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El método de pago es obligatorio.' })
  paymentMethod: string;

  @IsString({ message: 'La referencia de pago debe ser una cadena de texto.' })
  @IsOptional()
  reference?: string;
}
