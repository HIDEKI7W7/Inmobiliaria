import { IsEnum, Matches } from 'class-validator';

export enum OnboardingObjective {
  COMPRAR = 'COMPRAR',
  ALQUILAR = 'ALQUILAR',
  VENDER = 'VENDER',
}

export enum OnboardingPropertyInterest {
  CASA = 'CASA',
  DEPARTAMENTO = 'DEPARTAMENTO',
  TERRENO = 'TERRENO',
}

export class UpdateOnboardingDto {
  @IsEnum(OnboardingObjective)
  objective: OnboardingObjective;

  @IsEnum(OnboardingPropertyInterest)
  propertyInterest: OnboardingPropertyInterest;

  @Matches(/^\+?[1-9]\d{6,14}$/, {
    message: 'El WhatsApp debe tener un formato válido. Ejemplo: +59170712345',
  })
  whatsappPhone: string;
}
