import { IsNotEmpty, IsDefined } from 'class-validator';

export class CreateSavedSearchDto {
  @IsDefined({ message: 'El campo query es requerido.' })
  @IsNotEmpty({ message: 'El campo query no puede estar vacío.' })
  query: any;
}
