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

  @Matches(/^\+[1-9]\d{7,14}$/, {
    message: 'El WhatsApp debe estar en formato internacional. Ejemplo: +59170712345',
  })
  whatsappPhone: string;
}
