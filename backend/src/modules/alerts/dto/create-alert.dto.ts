import { IsString, IsNotEmpty, IsNumber, IsPositive, IsEnum, IsOptional } from 'class-validator';

export class CreateAlertDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty({ message: 'La zona de búsqueda es requerida.' })
  zona: string;

  @IsNumber()
  @IsPositive({ message: 'El precio máximo debe ser un valor positivo.' })
  precioMax: number;

  @IsEnum(['CASA', 'DEPARTAMENTO', 'TERRENO', 'OFICINA'], {
    message: 'El tipo de inmueble seleccionado no es válido.',
  })
  tipoInmueble: 'CASA' | 'DEPARTAMENTO' | 'TERRENO' | 'OFICINA';
}
