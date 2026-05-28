import { IsString, IsNotEmpty, IsNumber, IsPositive, IsDateString, IsUUID, IsOptional } from 'class-validator';

export class CreateExpenseDto {
  @IsString({ message: 'El concepto del gasto debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'El concepto del gasto es obligatorio.' })
  concept: string;

  @IsNumber({}, { message: 'El monto del gasto debe ser un valor numérico.' })
  @IsPositive({ message: 'El monto del gasto debe ser un número positivo mayor que cero.' })
  @IsNotEmpty({ message: 'El monto del gasto es obligatorio.' })
  amount: number;

  @IsDateString({}, { message: 'La fecha del gasto debe tener un formato de fecha válido (ISO 8601).' })
  @IsNotEmpty({ message: 'La fecha del gasto es obligatoria.' })
  date: string;

  @IsUUID(undefined, { message: 'El ID de la propiedad debe ser un UUID válido.' })
  @IsOptional()
  propertyId?: string;

  @IsString({ message: 'La categoría del gasto debe ser una cadena de texto.' })
  @IsNotEmpty({ message: 'La categoría del gasto es obligatoria.' })
  category: string;
}
